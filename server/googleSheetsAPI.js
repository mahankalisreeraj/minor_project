// const { GoogleSpreadsheet } = require('google-spreadsheet');
// const { JWT } = require('google-auth-library');

// // Ensure .env is loaded
// require('dotenv').config();

// class GoogleSheetsDB {
//   constructor() {
//     this.doc = null;
//     this.serviceAccountAuth = new JWT({
//       email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//       key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//     });
//   }

//   async initialize() {
//     this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, this.serviceAccountAuth);
//     await this.doc.loadInfo();
//   }

//   // User operations
//   async createUser(userData) {
//     const sheet = this.doc.sheetsByTitle['users'];
//     const row = await sheet.addRow({
//       id: Date.now().toString(),
//       ...userData,
//       createdAt: new Date().toISOString()
//     });
//     return row;
//   }

//   async findUserByEmail(email) {
//     const sheet = this.doc.sheetsByTitle['users'];
//     const rows = await sheet.getRows();
//     return rows.find(row => row.email === email);
//   }

//   async getAllUsers() {
//     const sheet = this.doc.sheetsByTitle['users'];
//     return await sheet.getRows();
//   }

//   // Product operations
//   async createProduct(productData) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const row = await sheet.addRow({
//       id: Date.now().toString(),
//       ...productData,
//       sales: 0,
//       createdAt: new Date().toISOString()
//     });
//     return row;
//   }

//   async getAllProducts() {
//     const sheet = this.doc.sheetsByTitle['products'];
//     return await sheet.getRows();
//   }

//   async getProductsBySeller(sellerId) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => row.sellerId === sellerId);
//   }

//   async updateProduct(productId, updates) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const rows = await sheet.getRows();
//     const product = rows.find(row => row.id === productId);
//     if (product) {
//       Object.keys(updates).forEach(key => {
//         product[key] = updates[key];
//       });
//       await product.save();
//       return product;
//     }
//     return null;
//   }

//   async deleteProduct(productId) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const rows = await sheet.getRows();
//     const product = rows.find(row => row.id === productId);
//     if (product) {
//       await product.delete();
//       return true;
//     }
//     return false;
//   }

//   // Cart operations
//   async addToCart(buyerId, productId, quantity = 1) {
//     const sheet = this.doc.sheetsByTitle['cart'];
//     const rows = await sheet.getRows();
//     const existingItem = rows.find(row => row.buyerId === buyerId && row.productId === productId);
    
//     if (existingItem) {
//       existingItem.quantity = (parseInt(existingItem.quantity) + quantity).toString();
//       await existingItem.save();
//       return existingItem;
//     } else {
//       return await sheet.addRow({
//         id: Date.now().toString(),
//         buyerId,
//         productId,
//         quantity: quantity.toString(),
//         addedAt: new Date().toISOString()
//       });
//     }
//   }

//   async getCartItems(buyerId) {
//     const sheet = this.doc.sheetsByTitle['cart'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => row.buyerId === buyerId);
//   }

//   async updateCartItem(cartId, quantity) {
//     const sheet = this.doc.sheetsByTitle['cart'];
//     const rows = await sheet.getRows();
//     const item = rows.find(row => row.id === cartId);
//     if (item) {
//       if (quantity <= 0) {
//         await item.delete();
//         return null;
//       } else {
//         item.quantity = quantity.toString();
//         await item.save();
//         return item;
//       }
//     }
//     return null;
//   }

//   async removeFromCart(cartId) {
//     const sheet = this.doc.sheetsByTitle['cart'];
//     const rows = await sheet.getRows();
//     const item = rows.find(row => row.id === cartId);
//     if (item) {
//       await item.delete();
//       return true;
//     }
//     return false;
//   }

//   // Order operations
//   async createOrder(orderData) {
//     const sheet = this.doc.sheetsByTitle['orders'];
//     return await sheet.addRow({
//       id: Date.now().toString(),
//       ...orderData,
//       status: 'pending',
//       createdAt: new Date().toISOString()
//     });
//   }

//   async getOrdersByBuyer(buyerId) {
//     const sheet = this.doc.sheetsByTitle['orders'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => row.buyerId === buyerId);
//   }

//   async getOrdersBySeller(sellerId) {
//     const sheet = this.doc.sheetsByTitle['orders'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => row.sellerId === sellerId);
//   }
// }

// module.exports = GoogleSheetsDB;
//###################################################################################################################################

// const { GoogleSpreadsheet } = require('google-spreadsheet');
// const { JWT } = require('google-auth-library');

// // Ensure .env is loaded
// require('dotenv').config();

// class GoogleSheetsDB {
//   constructor() {
//     this.doc = null;
//     this.serviceAccountAuth = new JWT({
//       email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//       key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//       scopes: ['https://www.googleapis.com/auth/spreadsheets'],
//     });
//   }

//   async initialize() {
//     try {
//       this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, this.serviceAccountAuth);
//       await this.doc.loadInfo();
//       console.log('✅ Google Sheets connected successfully');
//       console.log('Document title:', this.doc.title);
//     } catch (error) {
//       console.error('❌ Google Sheets connection failed:', error);
//       throw error;
//     }
//   }

//   // User operations - FIXED
//   async createUser(userData) {
//     const sheet = this.doc.sheetsByTitle['users'];
//     const row = await sheet.addRow({
//       id: Date.now().toString(),
//       firstName: userData.firstName,
//       lastName: userData.lastName,
//       email: userData.email,
//       password: userData.password,
//       userType: userData.userType,
//       businessName: userData.businessName || '',
//       phone: userData.phone,
//       createdAt: new Date().toISOString()
//     });
//     return row;
//   }

//   async findUserByEmail(email) {
//     try {
//       const sheet = this.doc.sheetsByTitle['users'];
//       const rows = await sheet.getRows();
      
//       console.log('Looking for email:', email);
//       console.log('Total users in sheet:', rows.length);
      
//       const user = rows.find(row => {
//         const rowEmail = row.get('email') || row.email;
//         console.log('Comparing with:', rowEmail);
//         return rowEmail === email;
//       });
      
//       return user;
//     } catch (error) {
//       console.error('Error finding user by email:', error);
//       return null;
//     }
//   }

//   async getAllUsers() {
//     const sheet = this.doc.sheetsByTitle['users'];
//     return await sheet.getRows();
//   }

//   // Product operations - FIXED
//   async createProduct(productData) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const row = await sheet.addRow({
//       id: Date.now().toString(),
//       sellerId: productData.sellerId,
//       name: productData.name,
//       price: productData.price.toString(),
//       cost: productData.cost.toString(),
//       stock: productData.stock.toString(),
//       sales: '0',
//       description: productData.description || '',
//       image: productData.image || '',
//       createdAt: new Date().toISOString()
//     });
//     return row;
//   }

//   async getAllProducts() {
//     const sheet = this.doc.sheetsByTitle['products'];
//     return await sheet.getRows();
//   }

//   async getProductsBySeller(sellerId) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => {
//       const rowSellerId = row.get('sellerId') || row.sellerId;
//       return rowSellerId === sellerId;
//     });
//   }

//   async updateProduct(productId, updates) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const rows = await sheet.getRows();
//     const product = rows.find(row => {
//       const rowId = row.get('id') || row.id;
//       return rowId === productId;
//     });
    
//     if (product) {
//       Object.keys(updates).forEach(key => {
//         product.set(key, updates[key]);
//       });
//       await product.save();
//       return product;
//     }
//     return null;
//   }

//   async deleteProduct(productId) {
//     const sheet = this.doc.sheetsByTitle['products'];
//     const rows = await sheet.getRows();
//     const product = rows.find(row => {
//       const rowId = row.get('id') || row.id;
//       return rowId === productId;
//     });
    
//     if (product) {
//       await product.delete();
//       return true;
//     }
//     return false;
//   }

//   // Cart operations - COMPLETELY FIXED
//   async addToCart(buyerId, productId, quantity = 1) {
//     try {
//       console.log('GoogleSheetsDB addToCart called:', { buyerId, productId, quantity });
      
//       const sheet = this.doc.sheetsByTitle['cart'];
//       if (!sheet) {
//         throw new Error('Cart sheet not found in Google Sheets');
//       }

//       // Ensure buyerId and productId are strings
//       const buyerIdStr = buyerId.toString();
//       const productIdStr = productId.toString();
//       const quantityNum = parseInt(quantity) || 1;

//       const rows = await sheet.getRows();
//       console.log('Current cart rows:', rows.length);
      
//       // Check if item already exists in cart - FIXED ACCESS METHOD
//       const existingItem = rows.find(row => {
//         const rowBuyerId = (row.get('buyerId') || row.buyerId || '').toString();
//         const rowProductId = (row.get('productId') || row.productId || '').toString();
//         return rowBuyerId === buyerIdStr && rowProductId === productIdStr;
//       });
      
//       if (existingItem) {
//         // Update existing item quantity - FIXED ACCESS METHOD
//         const currentQty = parseInt(existingItem.get('quantity') || existingItem.quantity || 0);
//         const newQty = currentQty + quantityNum;
        
//         existingItem.set('quantity', newQty.toString());
//         await existingItem.save();
        
//         console.log('Updated existing cart item:', {
//           id: existingItem.get('id'),
//           buyerId: existingItem.get('buyerId'),
//           productId: existingItem.get('productId'),
//           quantity: existingItem.get('quantity')
//         });
        
//         return existingItem;
//       } else {
//         // Add new item to cart
//         const newItemData = {
//           id: Date.now().toString(),
//           buyerId: buyerIdStr,
//           productId: productIdStr,
//           quantity: quantityNum.toString(),
//           addedAt: new Date().toISOString()
//         };
        
//         console.log('Adding new cart item:', newItemData);
        
//         const newItem = await sheet.addRow(newItemData);
        
//         console.log('Added new cart item successfully:', {
//           id: newItem.get('id'),
//           buyerId: newItem.get('buyerId'),
//           productId: newItem.get('productId'),
//           quantity: newItem.get('quantity')
//         });
        
//         return newItem;
//       }
//     } catch (error) {
//       console.error('Error in addToCart:', error);
//       throw error;
//     }
//   }

//   async getCartItems(buyerId) {
//     try {
//       const sheet = this.doc.sheetsByTitle['cart'];
//       const rows = await sheet.getRows();
//       return rows.filter(row => {
//         const rowBuyerId = row.get('buyerId') || row.buyerId;
//         return rowBuyerId === buyerId;
//       });
//     } catch (error) {
//       console.error('Error getting cart items:', error);
//       return [];
//     }
//   }

//   async updateCartItem(cartId, quantity) {
//     try {
//       const sheet = this.doc.sheetsByTitle['cart'];
//       const rows = await sheet.getRows();
//       const item = rows.find(row => {
//         const rowId = row.get('id') || row.id;
//         return rowId === cartId;
//       });
      
//       if (item) {
//         if (quantity <= 0) {
//           await item.delete();
//           return null;
//         } else {
//           item.set('quantity', quantity.toString());
//           await item.save();
//           return item;
//         }
//       }
//       return null;
//     } catch (error) {
//       console.error('Error updating cart item:', error);
//       return null;
//     }
//   }

//   async removeFromCart(cartId) {
//     try {
//       const sheet = this.doc.sheetsByTitle['cart'];
//       const rows = await sheet.getRows();
//       const item = rows.find(row => {
//         const rowId = row.get('id') || row.id;
//         return rowId === cartId;
//       });
      
//       if (item) {
//         await item.delete();
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error removing from cart:', error);
//       return false;
//     }
//   }

//   // Order operations - FIXED
//   async createOrder(orderData) {
//     const sheet = this.doc.sheetsByTitle['orders'];
//     return await sheet.addRow({
//       id: Date.now().toString(),
//       buyerId: orderData.buyerId,
//       sellerId: orderData.sellerId,
//       productId: orderData.productId,
//       quantity: orderData.quantity.toString(),
//       totalAmount: orderData.totalAmount.toString(),
//       status: 'pending',
//       createdAt: new Date().toISOString()
//     });
//   }

//   async getOrdersByBuyer(buyerId) {
//     const sheet = this.doc.sheetsByTitle['orders'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => {
//       const rowBuyerId = row.get('buyerId') || row.buyerId;
//       return rowBuyerId === buyerId;
//     });
//   }

//   async getOrdersBySeller(sellerId) {
//     const sheet = this.doc.sheetsByTitle['orders'];
//     const rows = await sheet.getRows();
//     return rows.filter(row => {
//       const rowSellerId = row.get('sellerId') || row.sellerId;
//       return rowSellerId === sellerId;
//     });
//   }
// }

// module.exports = GoogleSheetsDB;


const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

require('dotenv').config();

class GoogleSheetsDB {
  constructor() {
    this.doc = null;
    this.serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async initialize() {
    try {
      this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, this.serviceAccountAuth);
      await this.doc.loadInfo();
      console.log('✅ Google Sheets connected successfully');
      console.log('Document title:', this.doc.title);
    } catch (error) {
      console.error('❌ Google Sheets connection failed:', error);
      throw error;
    }
  }

  // User operations - FIXED
  async createUser(userData) {
    const sheet = this.doc.sheetsByTitle['users'];
    const row = await sheet.addRow({
      id: Date.now().toString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      userType: userData.userType,
      businessName: userData.businessName || '',
      phone: userData.phone,
      createdAt: new Date().toISOString()
    });
    return row;
  }

  async findUserByEmail(email) {
    try {
      const sheet = this.doc.sheetsByTitle['users'];
      const rows = await sheet.getRows();
      
      console.log('Looking for email:', email);
      console.log('Total users in sheet:', rows.length);
      
      const user = rows.find(row => {
        const rowEmail = row.get('email') || row.email;
        console.log('Comparing with:', rowEmail);
        return rowEmail === email;
      });
      
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async getAllUsers() {
    const sheet = this.doc.sheetsByTitle['users'];
    return await sheet.getRows();
  }

  // Product operations - FIXED
  async createProduct(productData) {
    const sheet = this.doc.sheetsByTitle['products'];
    const row = await sheet.addRow({
      id: Date.now().toString(),
      sellerId: productData.sellerId,
      name: productData.name,
      price: productData.price.toString(),
      cost: productData.cost.toString(),
      stock: productData.stock.toString(),
      sales: '0',
      description: productData.description || '',
      image: productData.image || '',
      createdAt: new Date().toISOString()
    });
    return row;
  }

  async getAllProducts() {
    const sheet = this.doc.sheetsByTitle['products'];
    return await sheet.getRows();
  }

  async getProductsBySeller(sellerId) {
    const sheet = this.doc.sheetsByTitle['products'];
    const rows = await sheet.getRows();
    return rows.filter(row => {
      const rowSellerId = row.get('sellerId') || row.sellerId;
      return rowSellerId === sellerId;
    });
  }

  async updateProduct(productId, updates) {
    const sheet = this.doc.sheetsByTitle['products'];
    const rows = await sheet.getRows();
    const product = rows.find(row => {
      const rowId = row.get('id') || row.id;
      return rowId === productId;
    });
    
    if (product) {
      Object.keys(updates).forEach(key => {
        product.set(key, updates[key]);
      });
      await product.save();
      return product;
    }
    return null;
  }

  async deleteProduct(productId) {
    const sheet = this.doc.sheetsByTitle['products'];
    const rows = await sheet.getRows();
    const product = rows.find(row => {
      const rowId = row.get('id') || row.id;
      return rowId === productId;
    });
    
    if (product) {
      await product.delete();
      return true;
    }
    return false;
  }

  // Cart operations - COMPLETELY FIXED
  async addToCart(buyerId, productId, quantity = 1) {
    try {
      console.log('GoogleSheetsDB addToCart called:', { buyerId, productId, quantity });
      
      const sheet = this.doc.sheetsByTitle['cart'];
      if (!sheet) {
        throw new Error('Cart sheet not found in Google Sheets');
      }

      const buyerIdStr = buyerId.toString();
      const productIdStr = productId.toString();
      const quantityNum = parseInt(quantity) || 1;

      const rows = await sheet.getRows();
      console.log('Current cart rows:', rows.length);
      
      const existingItem = rows.find(row => {
        const rowBuyerId = (row.get('buyerId') || row.buyerId || '').toString();
        const rowProductId = (row.get('productId') || row.productId || '').toString();
        return rowBuyerId === buyerIdStr && rowProductId === productIdStr;
      });
      
      if (existingItem) {
        const currentQty = parseInt(existingItem.get('quantity') || existingItem.quantity || 0);
        const newQty = currentQty + quantityNum;
        
        existingItem.set('quantity', newQty.toString());
        await existingItem.save();
        
        console.log('Updated existing cart item:', {
          id: existingItem.get('id'),
          buyerId: existingItem.get('buyerId'),
          productId: existingItem.get('productId'),
          quantity: existingItem.get('quantity')
        });
        
        return existingItem;
      } else {
        const newItemData = {
          id: Date.now().toString(),
          buyerId: buyerIdStr,
          productId: productIdStr,
          quantity: quantityNum.toString(),
          addedAt: new Date().toISOString()
        };
        
        console.log('Adding new cart item:', newItemData);
        
        const newItem = await sheet.addRow(newItemData);
        
        console.log('Added new cart item successfully:', {
          id: newItem.get('id'),
          buyerId: newItem.get('buyerId'),
          productId: newItem.get('productId'),
          quantity: newItem.get('quantity')
        });
        
        return newItem;
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error;
    }
  }

  async getCartItems(buyerId) {
    try {
      const sheet = this.doc.sheetsByTitle['cart'];
      const rows = await sheet.getRows();
      return rows.filter(row => {
        const rowBuyerId = row.get('buyerId') || row.buyerId;
        return rowBuyerId === buyerId;
      });
    } catch (error) {
      console.error('Error getting cart items:', error);
      return [];
    }
  }

  async updateCartItem(cartId, quantity) {
    try {
      const sheet = this.doc.sheetsByTitle['cart'];
      const rows = await sheet.getRows();
      const item = rows.find(row => {
        const rowId = row.get('id') || row.id;
        return rowId === cartId;
      });
      
      if (item) {
        if (quantity <= 0) {
          await item.delete();
          return null;
        } else {
          item.set('quantity', quantity.toString());
          await item.save();
          return item;
        }
      }
      return null;
    } catch (error) {
      console.error('Error updating cart item:', error);
      return null;
    }
  }

  async removeFromCart(cartId) {
    try {
      const sheet = this.doc.sheetsByTitle['cart'];
      const rows = await sheet.getRows();
      const item = rows.find(row => {
        const rowId = row.get('id') || row.id;
        return rowId === cartId;
      });
      
      if (item) {
        await item.delete();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  }

  // Order operations - FIXED
  async createOrder(orderData) {
    const sheet = this.doc.sheetsByTitle['orders'];
    return await sheet.addRow({
      id: Date.now().toString(),
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      productId: orderData.productId,
      quantity: orderData.quantity.toString(),
      totalAmount: orderData.totalAmount.toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  }

  async getOrdersByBuyer(buyerId) {
    const sheet = this.doc.sheetsByTitle['orders'];
    const rows = await sheet.getRows();
    return rows.filter(row => {
      const rowBuyerId = row.get('buyerId') || row.buyerId;
      return rowBuyerId === buyerId;
    });
  }

  async getOrdersBySeller(sellerId) {
    const sheet = this.doc.sheetsByTitle['orders'];
    const rows = await sheet.getRows();
    return rows.filter(row => {
      const rowSellerId = row.get('sellerId') || row.sellerId;
      return rowSellerId === sellerId;
    });
  }
}

module.exports = GoogleSheetsDB;
