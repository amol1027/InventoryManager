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

export interface Category {
  id?: number;
  name: string;
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

    const createCategoryTableQuery = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await this.database.executeSql(createProductTableQuery);
      console.log('Products table created successfully');
      await this.database.executeSql(createCategoryTableQuery);
      console.log('Categories table created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
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

      // Add indices for performance
      await this.database.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);"
      );
      await this.database.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);"
      );
      console.log('Database indices checked/created');

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
      const [result] = await this.database.executeSql('SELECT * FROM products ORDER BY updatedAt DESC');
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

  async getProducts(limit: number = 20, offset: number = 0): Promise<Product[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        'SELECT * FROM products ORDER BY updatedAt DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      const products: Product[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
      }

      return products;
    } catch (error) {
      console.error('Error getting products with pagination:', error);
      throw error;
    }
  }

  async getTotalProductCount(): Promise<number> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql('SELECT COUNT(*) as count FROM products');
      if (result.rows.length > 0) {
        return result.rows.item(0).count;
      }
      return 0;
    } catch (error) {
      console.error('Error getting total product count:', error);
      throw error;
    }
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const searchQuery = `%${query}%`;
      const [result] = await this.database.executeSql(
        'SELECT * FROM products WHERE name LIKE ? OR category LIKE ? OR details LIKE ? ORDER BY updatedAt DESC',
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

  // Category management methods
  async addCategory(category: Category): Promise<number> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    const { name } = category;
    const now = new Date().toISOString();

    try {
      const [result] = await this.database.executeSql(
        `INSERT INTO categories (name, createdAt, updatedAt) VALUES (?, ?, ?)`,
        [name, now, now]
      );

      return result.insertId || 0;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }

  async updateCategory(category: Category): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');
    if (!category.id) throw new Error('Category ID is required for update');

    const { id, name } = category;
    const now = new Date().toISOString();

    try {
      await this.database.executeSql(
        `UPDATE categories SET name = ?, updatedAt = ? WHERE id = ?`,
        [name, now, id]
      );
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql('DELETE FROM categories WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  async getCategoryById(id: number): Promise<Category | null> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        'SELECT * FROM categories WHERE id = ?',
        [id]
      );

      if (result.rows.length === 0) return null;
      return result.rows.item(0);
    } catch (error) {
      console.error('Error getting category by ID:', error);
      throw error;
    }
  }

  async getAllCategories(): Promise<Category[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql('SELECT * FROM categories ORDER BY name');
      const categories: Category[] = [];

      for (let i = 0; i < result.rows.length; i++) {
        categories.push(result.rows.item(i));
      }

      return categories;
    } catch (error) {
      console.error('Error getting all categories:', error);
      throw error;
    }
  }

  async getCategoriesWithProductCount(): Promise<Array<Category & { count: number }>> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(`
        SELECT c.*, COUNT(p.id) as count
        FROM categories c
        LEFT JOIN products p ON c.name = p.category
        GROUP BY c.id, c.name, c.createdAt, c.updatedAt
        ORDER BY c.name
      `);

      const categories: Array<Category & { count: number }> = [];
      for (let i = 0; i < result.rows.length; i++) {
        categories.push(result.rows.item(i));
      }

      return categories;
    } catch (error) {
      console.error('Error getting categories with product count:', error);
      throw error;
    }
  }

  async executeSql(sql: string, params?: any[]): Promise<any> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');
    try {
      return await this.database.executeSql(sql, params || []);
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
