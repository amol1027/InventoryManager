import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

// Define database types
type Database = SQLite.SQLiteDatabase;

export interface Product {
  id?: number;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  gstSlab?: number;
  quantity?: number;
  details?: string;
  imageUri?: string;
  createdAt?: string;
  updatedAt?: string;
}

class DatabaseService {
  private database: Database | null = null;
  private initialized: boolean = false;

  async initDatabase(): Promise<void> {
    if (this.initialized) return;

    try {
      this.database = await SQLite.openDatabase({
        name: 'inventoryManager.db',
        location: 'default',
      });
      
      await this.createTables();
      await this.migrateDatabase();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const createProductTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        discountPrice REAL,
        gstSlab REAL,
        quantity INTEGER DEFAULT 0,
        details TEXT,
        imageUri TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.database.executeSql(createProductTableQuery);
      console.log('Products table created successfully');
    } catch (error) {
      console.error('Error creating products table:', error);
      throw error;
    }
  }

  private async migrateDatabase(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Check if imageUri column exists
      const [result] = await this.database.executeSql(
        "PRAGMA table_info(products);"
      );

      let hasImageUri = false;
      let hasGstSlab = false;
      let hasQuantity = false;
      
      for (let i = 0; i < result.rows.length; i++) {
        const column = result.rows.item(i);
        if (column.name === 'imageUri') {
          hasImageUri = true;
        }
        if (column.name === 'gstSlab') {
          hasGstSlab = true;
        }
        if (column.name === 'quantity') {
          hasQuantity = true;
        }
      }

      if (!hasImageUri) {
        await this.database.executeSql(
          "ALTER TABLE products ADD COLUMN imageUri TEXT;"
        );
        console.log('Added imageUri column to products table');
      }

      if (!hasGstSlab) {
        await this.database.executeSql(
          "ALTER TABLE products ADD COLUMN gstSlab REAL;"
        );
        console.log('Added gstSlab column to products table');
      }

      if (!hasQuantity) {
        await this.database.executeSql(
          "ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 0;"
        );
        console.log('Added quantity column to products table');
      }
    } catch (error) {
      console.error('Error migrating database:', error);
      throw error;
    }
  }

  async addProduct(product: Product): Promise<number> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    const { name, category, price, discountPrice, gstSlab, quantity, details, imageUri } = product;
    const now = new Date().toISOString();

    try {
      const [result] = await this.database.executeSql(
        `INSERT INTO products (name, category, price, discountPrice, gstSlab, quantity, details, imageUri, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, category, price, discountPrice || null, gstSlab || null, quantity || 0, details || null, imageUri || null, now, now]
      );

      return result.insertId || 0;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(product: Product): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');
    if (!product.id) throw new Error('Product ID is required for update');

    const { id, name, category, price, discountPrice, gstSlab, quantity, details, imageUri } = product;
    const now = new Date().toISOString();

    try {
      await this.database.executeSql(
        `UPDATE products 
         SET name = ?, category = ?, price = ?, discountPrice = ?, gstSlab = ?, quantity = ?, details = ?, imageUri = ?, updatedAt = ? 
         WHERE id = ?`,
        [name, category, price, discountPrice || null, gstSlab || null, quantity || 0, details || null, imageUri || null, now, id]
      );
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql('DELETE FROM products WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async getProductById(id: number): Promise<Product | null> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) return null;
      return result.rows.item(0);
    } catch (error) {
      console.error('Error getting product by ID:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql('SELECT * FROM products');
      const products: Product[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
      }

      return products;
    } catch (error) {
      console.error('Error getting all products:', error);
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const searchQuery = `%${query}%`;
      const [result] = await this.database.executeSql(
        'SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR details LIKE ?',
        [searchQuery, searchQuery, searchQuery]
      );

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
      }

      return products;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
      this.initialized = false;
    }
  }
}

export default new DatabaseService();