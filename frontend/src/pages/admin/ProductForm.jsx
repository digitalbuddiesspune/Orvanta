import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI, categoryAPI } from '../../utils/api';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    searchTags: [''],
    category: '',
    subcategory: '',
    otherCategory: '',
    price: '',
    originalPrice: '',
    shortDescription: '',
    description: '',
    quantity: 0,
    availableStock: 10,
    maintainQtyForNotification: '',
    stockStatus: 'instock',
    minimumOrderableQuantity: 1,
    incrementor: '',
    isReturnable: false,
    sequenceListing: 0,
    allProductsOrder: 0,
    isActive: true,
    images: [''],
    galleryImages: [''],
    specifications: {
      color: '',
      material: '',
      size: '',
      brand: '',
      fit: '',
      pattern: ''
    },
    features: [''],
    bulkOffers: [{ minQty: '', pricePerPiece: '' }],
    customSpecFields: [{ key: '', value: '' }] // Custom specification fields
  });

  useEffect(() => {
    fetchCategories();
    if (isEdit) {
      fetchProduct();
    }
  }, [id]);

  // Update selected category when formData.category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const category = categories.find(cat => cat._id === formData.category);
      if (category) {
        console.log('Selected category:', category);
        console.log('Subcategories:', category.subcategories);
        setSelectedCategory(category);
      } else {
        setSelectedCategory(null);
      }
    } else {
      setSelectedCategory(null);
    }
  }, [formData.category, categories]);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('Fetching categories from:', `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/categories`);
      const response = await categoryAPI.getAllCategories();
      console.log('Categories API response:', response);
      if (response.success) {
        const cats = response.data || [];
        console.log('Fetched categories:', cats);
        console.log('Number of categories:', cats.length);
        if (cats.length > 0) {
          console.log('First category:', cats[0]);
          console.log('First category subcategories:', cats[0]?.subcategories);
        } else {
          console.warn('No categories found in database. Please seed categories.');
        }
        setCategories(cats);
      } else {
        console.error('API returned success: false', response);
        alert('Failed to load categories: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Error status:', error.response?.status);
      alert('Error loading categories: ' + (error.response?.data?.message || error.message));
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProductById(id);
      if (response.success) {
        const product = response.data;
        // Reset slug manual edit flag when loading existing product
        setSlugManuallyEdited(false);
        setFormData({
          name: product.name || '',
          slug: product.slug || '',
          searchTags: product.searchTags && product.searchTags.length > 0 ? product.searchTags : [''],
          category: product.category?._id || product.category || '',
          subcategory: product.subcategory || '',
          otherCategory: product.otherCategory || '',
          price: product.price || '',
          originalPrice: product.originalPrice || '',
          shortDescription: product.shortDescription || '',
          description: product.description || '',
          quantity: product.quantity || 0,
          availableStock: product.availableStock || 10,
          maintainQtyForNotification: product.maintainQtyForNotification || '',
          stockStatus: product.stockStatus || 'instock',
          minimumOrderableQuantity: product.minimumOrderableQuantity || 1,
          incrementor: product.incrementor || '',
          isReturnable: product.isReturnable !== undefined ? product.isReturnable : false,
          sequenceListing: product.sequenceListing || 0,
          allProductsOrder: product.allProductsOrder || 0,
          isActive: product.isActive !== undefined ? product.isActive : true,
          images: product.images && product.images.length > 0 ? product.images : [''],
          galleryImages: product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : [''],
          specifications: {
            color: product.specifications?.color || '',
            material: product.specifications?.material || '',
            size: typeof product.specifications?.size === 'string' ? product.specifications.size : '',
            brand: product.specifications?.brand || '',
            fit: product.specifications?.fit || '',
            pattern: product.specifications?.pattern || ''
          },
          customSpecFields: (() => {
            const standardFields = ['color', 'material', 'size', 'brand', 'fit', 'pattern'];
            const customFields = [];
            if (product.specifications) {
              Object.keys(product.specifications).forEach(key => {
                if (!standardFields.includes(key) && product.specifications[key] && typeof product.specifications[key] !== 'object') {
                  customFields.push({ key, value: product.specifications[key] });
                }
              });
            }
            return customFields.length > 0 ? customFields : [{ key: '', value: '' }];
          })(),
          features: product.features && product.features.length > 0 ? product.features : [''],
          bulkOffers: product.bulkOffers && product.bulkOffers.length > 0 
            ? product.bulkOffers.map(bo => ({ minQty: bo.minQty || '', pricePerPiece: bo.pricePerPiece || '' }))
            : [{ minQty: '', pricePerPiece: '' }]
        });
      }
    } catch (error) {
      alert('Failed to fetch product: ' + error.message);
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle category change - update selected category and reset subcategory
    if (name === 'category') {
      const category = categories.find(cat => cat._id === value);
      console.log('Category changed:', category);
      if (category) {
        console.log('Category subcategories:', category.subcategories);
        setSelectedCategory(category);
      } else {
        setSelectedCategory(null);
      }
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subcategory: '' // Reset subcategory when category changes
      }));
      return;
    }
    
    // Auto-update stockStatus when availableStock changes
    if (name === 'availableStock') {
      const stockValue = parseInt(value) || 0;
      let newStockStatus = formData.stockStatus;
      
      if (stockValue <= 0) {
        newStockStatus = 'outofstock';
      } else if (stockValue > 0 && stockValue <= 5) {
        newStockStatus = 'lowstock';
      } else {
        newStockStatus = 'instock';
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        stockStatus: newStockStatus
      }));
      return;
    }
    
    // Track manual slug edits
    if (name === 'slug') {
      setSlugManuallyEdited(true);
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
      return;
    }
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], 
        field === 'bulkOffers' ? { minQty: '', pricePerPiece: '' } :
        field === 'customSpecFields' ? { key: '', value: '' } :
        '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate slug from name only if slug hasn't been manually edited
      slug: slugManuallyEdited ? prev.slug : generateSlug(name)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate category
      if (!formData.category || formData.category.trim() === '') {
        alert('Please select a category');
        setLoading(false);
        return;
      }

      // Prepare data
      const submitData = {
        ...formData,
        category: formData.category.trim(), // Ensure category is not empty
        searchTags: formData.searchTags.filter(tag => tag.trim() !== ''),
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        quantity: parseInt(formData.quantity) || 0,
        availableStock: parseInt(formData.availableStock) || 0,
        stockStatus: formData.stockStatus || 'instock',
        minimumOrderableQuantity: parseInt(formData.minimumOrderableQuantity) || 1,
        incrementor: formData.incrementor ? parseFloat(formData.incrementor) : undefined,
        sequenceListing: parseInt(formData.sequenceListing) || 0,
        allProductsOrder: parseInt(formData.allProductsOrder) || 0,
        images: formData.images.filter(img => img.trim() !== ''),
        galleryImages: formData.galleryImages.filter(img => img.trim() !== ''),
        features: formData.features.filter(f => f.trim() !== ''),
        bulkOffers: formData.bulkOffers
          .filter(bo => bo.minQty && bo.pricePerPiece)
          .map(bo => ({
            minQty: parseInt(bo.minQty),
            pricePerPiece: parseFloat(bo.pricePerPiece)
          })),
        subcategory: formData.subcategory && formData.subcategory.trim() !== '' ? formData.subcategory.trim() : undefined,
        otherCategory: formData.otherCategory && formData.otherCategory.trim() !== '' ? formData.otherCategory.trim() : undefined,
      };

      // Merge custom specification fields into specifications
      const customFields = formData.customSpecFields
        .filter(field => field.key && field.value)
        .reduce((acc, field) => {
          acc[field.key] = field.value;
          return acc;
        }, {});

      // Clean up specifications - remove empty strings
      const cleanedSpecs = { ...submitData.specifications };
      Object.keys(cleanedSpecs).forEach(key => {
        if (cleanedSpecs[key] === '' || cleanedSpecs[key] === null || cleanedSpecs[key] === undefined) {
          delete cleanedSpecs[key];
        }
      });

      // Merge custom fields
      const finalSpecs = {
        ...cleanedSpecs,
        ...customFields
      };

      // Only include specifications if it has at least one field
      if (Object.keys(finalSpecs).length > 0) {
        submitData.specifications = finalSpecs;
      } else {
        delete submitData.specifications;
      }

      // Remove customSpecFields from submitData as it's not part of the schema
      delete submitData.customSpecFields;

      if (isEdit) {
        await productAPI.updateProduct(id, submitData);
        alert('Product updated successfully!');
      } else {
        await productAPI.createProduct(submitData);
        alert('Product created successfully!');
      }
      
      navigate('/admin/products');
    } catch (error) {
      alert('Failed to save product: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4">
        <div className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-600">
            {isEdit ? 'Update product information' : 'Create a new product'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 space-y-3 sm:space-y-4">
          {/* Basic Information */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Basic Information</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleNameChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Category *
                  </label>
                  {categoriesLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Loading categories...
                    </div>
                  ) : (
                    <>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select Category</option>
                        {categories.length > 0 ? (
                          categories.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                          ))
                        ) : (
                          <option value="" disabled>No categories available</option>
                        )}
                      </select>
                      {categories.length === 0 && !categoriesLoading && (
                        <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs text-yellow-800 font-medium">No categories found!</p>
                          <p className="text-xs text-yellow-700 mt-0.5">
                            Please seed categories or create from admin panel.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Subcategory (Optional)
                  </label>
                  {formData.category ? (() => {
                    const currentCategory = categories.find(cat => cat._id === formData.category);
                    return currentCategory && currentCategory.subcategories && currentCategory.subcategories.length > 0 ? (
                      <select
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="">Select Subcategory (Optional)</option>
                        {currentCategory.subcategories.map((subcat, index) => (
                          <option key={index} value={subcat}>{subcat}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                        No subcategories available
                      </div>
                    );
                  })() : (
                    <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                      Select category first
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Other Category (Optional)
                  </label>
                  <input
                    type="text"
                    name="otherCategory"
                    value={formData.otherCategory}
                    onChange={handleChange}
                    placeholder="Enter other category"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Search Tags
                  </label>
                {formData.searchTags.map((tag, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => handleArrayChange('searchTags', index, e.target.value)}
                      placeholder="Enter search tag"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {formData.searchTags.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('searchTags', index)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('searchTags')}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Search Tag
                </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Original Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Images (URLs)
                </label>
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleArrayChange('images', index, e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('images', index)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('images')}
                  className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Image
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isReturnable"
                    checked={formData.isReturnable}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">Product Returnable</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <label className="ml-2 text-sm text-gray-900">Status: Active</label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Sequence Listing
                  </label>
                  <input
                    type="number"
                    name="sequenceListing"
                    value={formData.sequenceListing}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Category order"
                  />
                  <p className="text-xs text-gray-500 mt-1">For category pages</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    For all product page sequence number
                  </label>
                  <input
                    type="number"
                    name="allProductsOrder"
                    value={formData.allProductsOrder}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Sequence number for all products page"
                  />
                  <p className="text-xs text-gray-500 mt-1">Controls order on all products page</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-900 mb-0.5">
                    Stock Status
                  </label>
                  <select
                    name="stockStatus"
                    value={formData.stockStatus}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                    <option value="lowstock">Low Stock</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Management */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Stock Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Available Stock
                </label>
                <input
                  type="number"
                  name="availableStock"
                  value={formData.availableStock}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Minimum Orderable Quantity
                </label>
                <input
                  type="number"
                  name="minimumOrderableQuantity"
                  value={formData.minimumOrderableQuantity}
                  onChange={handleChange}
                  placeholder="Orderable Quantity"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">
                  Incrementor (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="incrementor"
                  value={formData.incrementor}
                  onChange={handleChange}
                  placeholder="Incrementor (Optional)"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Specifications (Fashion)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">Color</label>
                <input
                  type="text"
                  name="specifications.color"
                  value={formData.specifications.color}
                  onChange={handleChange}
                  placeholder="e.g. Red, Blue, Black"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">Material</label>
                <input
                  type="text"
                  name="specifications.material"
                  value={formData.specifications.material}
                  onChange={handleChange}
                  placeholder="e.g. Cotton, Leather, Polyester"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">Size</label>
                <input
                  type="text"
                  name="specifications.size"
                  value={formData.specifications.size}
                  onChange={handleChange}
                  placeholder="e.g. S, M, L, XL or 28, 30"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">Brand</label>
                <input
                  type="text"
                  name="specifications.brand"
                  value={formData.specifications.brand}
                  onChange={handleChange}
                  placeholder="Brand name"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">Fit</label>
                <input
                  type="text"
                  name="specifications.fit"
                  value={formData.specifications.fit}
                  onChange={handleChange}
                  placeholder="e.g. Slim, Regular, Relaxed"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-900 mb-0.5">Pattern</label>
                <input
                  type="text"
                  name="specifications.pattern"
                  value={formData.specifications.pattern}
                  onChange={handleChange}
                  placeholder="e.g. Solid, Striped, Printed"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            {/* Custom Specification Fields */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-900">Custom Specification Fields</h3>
                <button
                  type="button"
                  onClick={() => addArrayItem('customSpecFields')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  + Add Custom Field
                </button>
              </div>
              <div className="space-y-3">
                {formData.customSpecFields.map((field, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => {
                        const newFields = [...formData.customSpecFields];
                        newFields[index] = { ...newFields[index], key: e.target.value };
                        setFormData(prev => ({ ...prev, customSpecFields: newFields }));
                      }}
                      placeholder="Field Name (e.g., Brand, Model, Warranty)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...formData.customSpecFields];
                        newFields[index] = { ...newFields[index], value: e.target.value };
                        setFormData(prev => ({ ...prev, customSpecFields: newFields }));
                      }}
                      placeholder="Field Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {formData.customSpecFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('customSpecFields', index)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Add custom fields for product specifications (e.g., Care Instructions, Season, etc.)
              </p>
            </div>
          </div>

          {/* Features */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Features</h2>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayChange('features', index, e.target.value)}
                  placeholder="Feature"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('features', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('features')}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              + Add Feature
            </button>
          </div>

          {/* Bulk Offers */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Bulk Offers</h2>
            {formData.bulkOffers.map((offer, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="number"
                  value={offer.minQty}
                  onChange={(e) => handleArrayChange('bulkOffers', index, { ...offer, minQty: e.target.value })}
                  placeholder="Min Quantity"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  step="0.01"
                  value={offer.pricePerPiece}
                  onChange={(e) => handleArrayChange('bulkOffers', index, { ...offer, pricePerPiece: e.target.value })}
                  placeholder="Price per Piece"
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg"
                />
                {formData.bulkOffers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem('bulkOffers', index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('bulkOffers')}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              + Add Bulk Offer
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 text-sm"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;

