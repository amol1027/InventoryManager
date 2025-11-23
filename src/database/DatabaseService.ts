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
  imageUri?: string; // Primary image (for backward compatibility)
  images?: string[]; // Array of all image URIs (loaded separately)
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id?: number;
  productId: number;
  imageUri: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt?: string;
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

    const createProductImagesTableQuery = `
      CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        imageUri TEXT NOT NULL,
        displayOrder INTEGER NOT NULL DEFAULT 0,
        isPrimary INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
      )
    `;

    try {
      await this.database.executeSql(createProductTableQuery);
      console.log('Products table created successfully');
      await this.database.executeSql(createCategoryTableQuery);
      console.log('Categories table created successfully');
      await this.database.executeSql(createProductImagesTableQuery);
      console.log('Product images table created successfully');
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
      await this.database.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_product_images_productId ON product_images(productId);"
      );
      await this.database.executeSql(
        "CREATE INDEX IF NOT EXISTS idx_product_images_isPrimary ON product_images(isPrimary);"
      );
      console.log('Database indices checked/created');

      // Migrate existing imageUri to product_images table
      await this.migrateExistingImages();
    } catch (error) {
      console.error('Error migrating database:', error);
      throw error;
    }
  }

  private async migrateExistingImages(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Check if migration has already been done
      const [checkResult] = await this.database.executeSql(
        "SELECT COUNT(*) as count FROM product_images;"
      );

      if (checkResult.rows.item(0).count > 0) {
        console.log('Image migration already completed');
        return;
      }

      // Get all products with imageUri
      const [productsResult] = await this.database.executeSql(
        "SELECT id, imageUri FROM products WHERE imageUri IS NOT NULL AND imageUri != '';"
      );

      for (let i = 0; i < productsResult.rows.length; i++) {
        const product = productsResult.rows.item(i);
        await this.database.executeSql(
          "INSERT INTO product_images (productId, imageUri, displayOrder, isPrimary) VALUES (?, ?, 0, 1);",
          [product.id, product.imageUri]
        );
      }

      console.log(`Migrated ${productsResult.rows.length} existing product images`);
    } catch (error) {
      console.error('Error migrating existing images:', error);
      // Don't throw - migration failure shouldn't break the app
    }
  }

  async addProduct(product: Product): Promise<number> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    const { name, category, price, discountPrice, gstSlab, quantity, details, imageUri, images } = product;
    const now = new Date().toISOString();

    try {
      const [result] = await this.database.executeSql(
        `INSERT INTO products (name, category, price, discountPrice, gstSlab, quantity, details, imageUri, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, category, price, discountPrice || null, gstSlab || null, quantity || 0, details || null, imageUri || null, now, now]
      );

      const productId = result.insertId || 0;

      if (images !== undefined || imageUri) {
        const imageList = images ?? (imageUri ? [imageUri] : []);
        await this.saveProductImages(productId, imageList);
      }

      return productId;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  }

  async updateProduct(product: Product): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');
    if (!product.id) throw new Error('Product ID is required for update');

    const { id, name, category, price, discountPrice, gstSlab, quantity, details, imageUri, images } = product;
    const now = new Date().toISOString();

    try {
      await this.database.executeSql(
        `UPDATE products 
         SET name = ?, category = ?, price = ?, discountPrice = ?, gstSlab = ?, quantity = ?, details = ?, imageUri = ?, updatedAt = ? 
         WHERE id = ?`,
        [name, category, price, discountPrice || null, gstSlab || null, quantity || 0, details || null, imageUri || null, now, id]
      );

      if (images !== undefined) {
        await this.saveProductImages(id, images);
      }
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
      const product = result.rows.item(0);

      const productImages = await this.getProductImages(id);
      if (productImages.length > 0) {
        product.images = productImages.map(image => image.imageUri);
        if (!product.imageUri) {
          product.imageUri = product.images[0];
        }
      }

      return product;
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

  async getProductsByCategory(category: string): Promise<Product[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        'SELECT * FROM products WHERE category = ?',
        [category]
      );

      const products: Product[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        products.push(result.rows.item(i));
      }

      return products;
    } catch (error) {
      console.error('Error getting products by category:', error);
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

  // Product Image Management Methods
  async addProductImage(productId: number, imageUri: string, isPrimary: boolean = false): Promise<number> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    try {
      // Get the next display order
      const [orderResult] = await this.database.executeSql(
        'SELECT COALESCE(MAX(displayOrder), -1) + 1 as nextOrder FROM product_images WHERE productId = ?',
        [productId]
      );
      const displayOrder = orderResult.rows.item(0).nextOrder;

      // If this is set as primary, unset other primary images for this product
      if (isPrimary) {
        await this.database.executeSql(
          'UPDATE product_images SET isPrimary = 0 WHERE productId = ?',
          [productId]
        );
      }

      const [result] = await this.database.executeSql(
        'INSERT INTO product_images (productId, imageUri, displayOrder, isPrimary, createdAt) VALUES (?, ?, ?, ?, ?)',
        [productId, imageUri, displayOrder, isPrimary ? 1 : 0, now]
      );

      // Update product's imageUri if this is the primary image
      if (isPrimary) {
        await this.database.executeSql(
          'UPDATE products SET imageUri = ? WHERE id = ?',
          [imageUri, productId]
        );
      }

      return result.insertId || 0;
    } catch (error) {
      console.error('Error adding product image:', error);
      throw error;
    }
  }

  private async saveProductImages(productId: number, images: string[]): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const sanitizedImages = images.filter((uri) => !!uri);

      await this.database.executeSql('DELETE FROM product_images WHERE productId = ?', [productId]);

      if (sanitizedImages.length === 0) {
        await this.database.executeSql('UPDATE products SET imageUri = NULL WHERE id = ?', [productId]);
        return;
      }

      for (let index = 0; index < sanitizedImages.length; index++) {
        const uri = sanitizedImages[index];
        await this.database.executeSql(
          'INSERT INTO product_images (productId, imageUri, displayOrder, isPrimary, createdAt) VALUES (?, ?, ?, ?, ?)',
          [productId, uri, index, index === 0 ? 1 : 0, new Date().toISOString()]
        );
      }

      await this.database.executeSql(
        'UPDATE products SET imageUri = ? WHERE id = ?',
        [sanitizedImages[0], productId]
      );
    } catch (error) {
      console.error('Error saving product images:', error);
      throw error;
    }
  }

  async getProductImages(productId: number): Promise<ProductImage[]> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      const [result] = await this.database.executeSql(
        'SELECT * FROM product_images WHERE productId = ? ORDER BY displayOrder ASC',
        [productId]
      );

      const images: ProductImage[] = [];
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        images.push({
          id: row.id,
          productId: row.productId,
          imageUri: row.imageUri,
          displayOrder: row.displayOrder,
          isPrimary: row.isPrimary === 1,
          createdAt: row.createdAt,
        });
      }

      return images;
    } catch (error) {
      console.error('Error getting product images:', error);
      throw error;
    }
  }

  async deleteProductImage(imageId: number): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Get image info before deleting
      const [imageResult] = await this.database.executeSql(
        'SELECT productId, isPrimary FROM product_images WHERE id = ?',
        [imageId]
      );

      if (imageResult.rows.length === 0) {
        throw new Error('Image not found');
      }

      const { productId, isPrimary } = imageResult.rows.item(0);

      // Delete the image
      await this.database.executeSql('DELETE FROM product_images WHERE id = ?', [imageId]);

      // If this was the primary image, set another image as primary
      if (isPrimary === 1) {
        const [remainingImages] = await this.database.executeSql(
          'SELECT id, imageUri FROM product_images WHERE productId = ? ORDER BY displayOrder ASC LIMIT 1',
          [productId]
        );

        if (remainingImages.rows.length > 0) {
          const newPrimary = remainingImages.rows.item(0);
          await this.setPrimaryImage(productId, newPrimary.id);
        } else {
          // No images left, clear product's imageUri
          await this.database.executeSql(
            'UPDATE products SET imageUri = NULL WHERE id = ?',
            [productId]
          );
        }
      }
    } catch (error) {
      console.error('Error deleting product image:', error);
      throw error;
    }
  }

  async updateImageOrder(imageId: number, newOrder: number): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE product_images SET displayOrder = ? WHERE id = ?',
        [newOrder, imageId]
      );
    } catch (error) {
      console.error('Error updating image order:', error);
      throw error;
    }
  }

  async setPrimaryImage(productId: number, imageId: number): Promise<void> {
    if (!this.database) await this.initDatabase();
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Get the image URI
      const [imageResult] = await this.database.executeSql(
        'SELECT imageUri FROM product_images WHERE id = ? AND productId = ?',
        [imageId, productId]
      );

      if (imageResult.rows.length === 0) {
        throw new Error('Image not found');
      }

      const imageUri = imageResult.rows.item(0).imageUri;

      // Unset all primary flags for this product
      await this.database.executeSql(
        'UPDATE product_images SET isPrimary = 0 WHERE productId = ?',
        [productId]
      );

      // Set the new primary image
      await this.database.executeSql(
        'UPDATE product_images SET isPrimary = 1 WHERE id = ?',
        [imageId]
      );

      // Update product's imageUri
      await this.database.executeSql(
        'UPDATE products SET imageUri = ? WHERE id = ?',
        [imageUri, productId]
      );
    } catch (error) {
      console.error('Error setting primary image:', error);
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
