const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await Category.deleteMany({});
    console.log('Cleared existing categories');

    // Create default categories
    const defaultCategories = [
      { name: 'Technology', description: 'Tech news, tutorials, and reviews', color: '#3B82F6' },
      { name: 'Programming', description: 'Coding tutorials and best practices', color: '#10B981' },
      { name: 'Web Development', description: 'Frontend and backend development', color: '#F59E0B' },
      { name: 'Data Science', description: 'Data analysis and machine learning', color: '#8B5CF6' },
      { name: 'Design', description: 'UI/UX and graphic design', color: '#EC4899' },
      { name: 'Business', description: 'Business strategies and entrepreneurship', color: '#6B7280' },
      { name: 'Lifestyle', description: 'Personal development and lifestyle tips', color: '#14B8A6' },
      { name: 'Travel', description: 'Travel guides and experiences', color: '#F97316' }
    ];

    await Category.insertMany(defaultCategories);
    console.log('Default categories created successfully');

    const categories = await Category.find();
    console.log('Categories:', categories.map(c => c.name));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories();
