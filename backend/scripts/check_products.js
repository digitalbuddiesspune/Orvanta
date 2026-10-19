import dotenv from 'dotenv';
import connectDB from '../config/databaseConnection.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

dotenv.config();

const checkProducts = async () => {
  try {
    await connectDB();
    
    const categories = await Category.find({});
    console.log('Categories found:', categories.map(cat => ({ name: cat.name, slug: cat.slug, _id: cat._id })));

    // Let's check for any category named "Men Shirts" or "Men's Shirts"
    const cat = await Category.findOne({ name: { $regex: 'Men Shirts', $options: 'i' } });
    if (!cat) {
      console.log('Category "Men Shirts" not found by name');
    } else {
        const count = await Product.countDocuments({ category: cat._id });
        console.log(`Products in category "${cat.name}":`, count);
        
        const subCount = await Product.countDocuments({ category: cat._id, subcategory: 'Shirts' });
        console.log(`Products in subcategory "Shirts":`, subCount);
        
        const activeCount = await Product.countDocuments({ category: cat._id, isActive: true });
        console.log(`Active products in category:`, activeCount);
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkProducts();
