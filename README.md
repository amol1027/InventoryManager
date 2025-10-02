# Inventory Manager

A comprehensive inventory management application built with React Native and SQLite for efficient business inventory tracking.

## 🚀 Features

### Core Features
- **Product Management**: Add, edit, and delete products with comprehensive information
- **Advanced Categorization**: Organize products by categories with visual category badges
- **Dynamic Pricing**: Track regular and discount prices with percentage calculations
- **GST Compliance**: Built-in GST slab support (0%, 5%, 12%, 18%, 28%)
- **Inventory Tracking**: Real-time quantity management with stock status indicators
- **Smart Search & Filter**: Quickly find products with search and filtering options

### Advanced Features
- **Stock Status Indicators**:
  - 🟢 In Stock (>10 units)
  - 🟡 Low Stock (1-10 units)
  - 🔴 Out of Stock (0 units)
- **Dynamic Updates**: Product list refreshes automatically when changes are made
- **Image Support**: Add product images from camera or gallery
- **Detailed Product Information**: Store specifications, descriptions, and metadata
- **Date Tracking**: Creation and last updated timestamps with proper formatting

### User Interface
- **Modern Design**: Clean, professional interface with intuitive navigation
- **Responsive Layout**: Optimized for various device sizes and orientations
- **Drawer Navigation**: Easy access to all app features
- **Real-time Validation**: Form validation with helpful error messages
- **Visual Feedback**: Loading states, success messages, and error handling

## 📱 Screens

- **Dashboard**: Overview of all products with search, filter, and stock status
- **Add Item**: Comprehensive form to add new products with validation
- **Product Detail**: View and edit complete product information
- **Settings**: Configure app preferences and options
- **About**: Information about the application

## 🏗️ Project Structure

```
src/
├── components/       # Reusable UI components
├── database/         # SQLite database configuration and services
├── navigation/       # Navigation configuration
├── screens/          # Application screens
├── theme/            # UI theme definitions (colors, styles)
└── utils/            # Utility functions
```

## 🛠️ Technology Stack

- **React Native 0.81.4**: Cross-platform mobile development
- **TypeScript**: Type-safe JavaScript development
- **SQLite**: Local database for offline storage
- **React Navigation**: Navigation between screens
- **React Native Vector Icons**: Icon library for UI elements
- **React Native Image Picker**: Camera and gallery image selection
- **React Native Reanimated**: Smooth animations and transitions
- **React Native Gesture Handler**: Touch gesture handling

## 🚀 Getting Started

> **Note**: Make sure you have completed the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Prerequisites

- Node.js (version 20 or higher)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)

### Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

From the root of your React Native project:

```bash
# Using npm
npm start

# OR using Yarn
yarn start
```

### Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands:

#### Android

```bash
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```bash
bundle install
```

Then, and every time you update your native dependencies, run:

```bash
bundle exec pod install
```

For iOS development:

```bash
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

## 🔧 Database Schema

The app uses SQLite with the following product table structure:

```sql
CREATE TABLE products (
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
);
```

## 📊 Features in Detail

### Product Management
- **Complete CRUD Operations**: Create, Read, Update, Delete products
- **Rich Product Data**: Name, category, price, discount price, GST slab, quantity, description, images
- **Image Integration**: Capture or select product images
- **Validation**: Comprehensive form validation with user-friendly error messages

### GST Support
- **Multiple GST Slabs**: Support for standard Indian GST rates (0%, 5%, 12%, 18%, 28%)
- **Automatic Calculations**: GST information stored and displayed with products
- **Compliance Ready**: Built for Indian market GST requirements

### Inventory Management
- **Quantity Tracking**: Real-time inventory quantity management
- **Stock Alerts**: Visual indicators for stock status
- **Low Stock Warnings**: Automatic alerts for items running low
- **Inventory Overview**: Dashboard view of all inventory levels

### Search & Navigation
- **Real-time Search**: Instant search across product names, categories, and descriptions
- **Category Filtering**: Filter products by category
- **Intuitive Navigation**: Drawer-based navigation for easy access
- **Quick Actions**: Fast access to add new items and view details

## 🎨 UI/UX Features

- **Modern Design Language**: Clean, professional interface
- **Consistent Theming**: Unified color scheme and typography
- **Responsive Layout**: Works on phones and tablets
- **Accessibility**: Proper contrast ratios and touch targets
- **Loading States**: Visual feedback during data operations

## 🔒 Data Management

- **Offline First**: All data stored locally using SQLite
- **Data Persistence**: Reliable storage with proper indexing
- **Migration Support**: Automatic database schema updates
- **Backup Ready**: Local storage for easy backup and restore

## 🚀 Performance

- **Optimized Queries**: Efficient database operations
- **Lazy Loading**: Images and data loaded on demand
- **Memory Management**: Proper cleanup and memory usage
- **Smooth Animations**: 60fps animations using Reanimated

## 🛠️ Development

### Available Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Code Quality

- **TypeScript**: Full type safety across the application
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting consistency
- **Testing**: Jest testing framework setup

## 📈 Future Enhancements

- [ ] Barcode scanning for quick product entry
- [ ] Export functionality (CSV, PDF reports)
- [ ] Multi-user support with role-based access
- [ ] Cloud synchronization
- [ ] Advanced analytics and reporting
- [ ] Bulk operations for inventory management
- [ ] Product variants and sizes
- [ ] Supplier management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native community for excellent documentation and tools
- Open source contributors for libraries and utilities
- Modern React Native architecture patterns and best practices

---

**Made with ❤️ for efficient inventory management**
