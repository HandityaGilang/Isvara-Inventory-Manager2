import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Calculator,
  X,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const ProductForm = ({ onOpenCalculator }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user?.role === 'STAFF') {
      navigate('/inventory');
    }
  }, [user, navigate]);
  
  const [formData, setFormData] = useState({
    seller_sku: '',
    shop_sku: '',
    style_name: '',
    category: '',
    distribution_channel: '',
    size_s: 0,
    size_m: 0,
    size_l: 0,
    size_xl: 0,
    size_xxl: 0,
    size_xxxl: 0,
    size_onesize: 0,
    price: 0,
    cost: 0,
    shipping_cost: 0,
    platform_commission: 0,
    discount: 0,
    tax: 0,
    admin_fee: 0,
    commission: 0,
    status: 'Active',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skuExists, setSkuExists] = useState(false);
  const [styleNameExists, setStyleNameExists] = useState(false);
  
  // State for multiple images
  // Each item: { file: File|null, previewUrl: string, originalUrl: string|null, isNew: boolean }
  const [productImages, setProductImages] = useState([]);
  
  const [categories, setCategories] = useState(['Kaos', 'Kemeja', 'Jaket', 'Celana', 'Dress', 'Aksesoris']);
  const [distributionChannels, setDistributionChannels] = useState(['Shopee', 'Tokopedia', 'Zalora', 'Website', 'Offline Store']);

  const [inputModes, setInputModes] = useState({
    discount: 'rp',
    tax: 'rp',
    commission: 'rp',
    platform_commission: 'rp'
  });

  const [percentValues, setPercentValues] = useState({
    discount: '',
    tax: '',
    commission: '',
    platform_commission: ''
  });

  const toggleInputMode = (field) => {
    setInputModes(prev => {
      const newMode = prev[field] === 'rp' ? 'percent' : 'rp';
      
      if (newMode === 'percent') {
        const price = formData.price || 0;
        const value = formData[field] || 0;
        const percent = price > 0 ? ((value / price) * 100).toFixed(2) : '0';
        setPercentValues(p => ({ ...p, [field]: percent.replace(/\.00$/, '') }));
      }
      
      return { ...prev, [field]: newMode };
    });
  };

  const handleFinancialChange = (e, field) => {
    const { value } = e.target;
    
    if (inputModes[field] === 'percent') {
      let cleanValue = value.replace(/[^0-9.]/g, '');
      
      // Validation: Clamp between 0 and 100
      const numVal = parseFloat(cleanValue);
      if (numVal > 100) cleanValue = '100';
      if (numVal < 0) cleanValue = '0';

      setPercentValues(prev => ({ ...prev, [field]: cleanValue }));
      
      const percent = parseFloat(cleanValue) || 0;
      const price = formData.price || 0;
      const rpValue = Math.round((percent / 100) * price);
      
      setFormData(prev => ({ ...prev, [field]: rpValue }));
    } else {
      const numericValue = parseRupiah(value);
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    }
  };

  const addActivityLogEntry = async (entry) => {
    try {
      const now = new Date();
      const timestamp = now.getTime();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      
      const newEntry = {
        timestamp,
        date,
        user: user?.username || 'Unknown',
        role: user?.role || 'OWNER',
        ...entry
      };
      
      await db.logs.add(newEntry);
    } catch (error) {
      console.error('Failed to add activity log entry:', error);
    }
  };


  const formatRupiah = (value) => {
    if (value === null || value === undefined) return '0';
    const numeric = Number(value) || 0;
    return numeric.toLocaleString('id-ID');
  };

  const parseRupiah = (value) => {
    if (!value) return 0;
    const numericString = value.toString().replace(/[^\d]/g, '');
    if (!numericString) return 0;
    return parseInt(numericString, 10) || 0;
  };

  useEffect(() => {
    if (isEdit) {
      const loadProduct = async () => {
        try {
          const products = await db.products.getAll();
          const product = products.find(p => p.id === parseInt(id, 10) || p.id === id);
          
          if (product) {
            setFormData(prev => ({
              ...prev,
              ...product,
              // Ensure numeric values are numbers
              size_s: parseFloat(product.size_s) || 0,
              size_m: parseFloat(product.size_m) || 0,
              size_l: parseFloat(product.size_l) || 0,
              size_xl: parseFloat(product.size_xl) || 0,
              size_xxl: parseFloat(product.size_xxl) || 0,
              size_xxxl: parseFloat(product.size_xxxl) || 0,
              size_onesize: parseFloat(product.size_onesize) || 0,
              price: parseFloat(product.price) || 0,
              cost: parseFloat(product.cost) || 0,
              shipping_cost: parseFloat(product.shipping_cost) || 0,
              platform_commission: parseFloat(product.platform_commission) || 0,
              discount: parseFloat(product.discount) || 0,
              tax: parseFloat(product.tax) || 0,
              admin_fee: parseFloat(product.admin_fee) || 0,
              commission: parseFloat(product.commission) || 0
            }));
            
            // Initialize images
            let initialImages = [];
            if (product.images && Array.isArray(product.images) && product.images.length > 0) {
              initialImages = product.images.map(url => ({ 
                file: null, 
                previewUrl: url, 
                originalUrl: url, 
                isNew: false 
              }));
            } else if (product.imageUrl) {
              initialImages = [{ 
                file: null, 
                previewUrl: product.imageUrl, 
                originalUrl: product.imageUrl, 
                isNew: false 
              }];
            }
            setProductImages(initialImages);

          } else {
            console.error('Product not found');
            // Maybe navigate back or show error
          }
        } catch (error) {
          console.error('Failed to load product for edit:', error);
        }
      };
      
      loadProduct();
    }
  }, [id, isEdit]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const categories = await db.settings.getCategories();
        if (Array.isArray(categories) && categories.length > 0) {
          setCategories(categories);
        }

        const channels = await db.settings.getChannels();
        if (Array.isArray(channels) && channels.length > 0) {
          setDistributionChannels(channels);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Load all products for validation
  const [allProducts, setAllProducts] = useState([]);
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await db.products.getAll();
        setAllProducts(products);
      } catch (error) {
        console.error('Failed to load products for validation:', error);
      }
    };
    loadProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
       const newPrice = parseRupiah(value);
       setPercentValues(prev => {
         const next = { ...prev };
         ['discount', 'tax', 'commission'].forEach(field => {
            const val = formData[field] || 0;
            const pct = newPrice > 0 ? ((val / newPrice) * 100).toFixed(2) : '0';
            next[field] = pct.replace(/\.00$/, '');
         });
         return next;
       });
    }

    setFormData(prev => ({
      ...prev,
      [name]: name.includes('size_')
        ? parseFloat(value) || 0
        : ([
            'price',
            'cost',
            'shipping_cost',
            'platform_commission',
            'discount',
            'tax',
            'admin_fee',
            'commission'
          ].includes(name)
            ? parseRupiah(value)
            : value)
    }));

    // Validasi real-time untuk SKU dan Style Name
    if (name === 'seller_sku') {
      const source = allProducts;

      if (source.length === 0) {
        // No products yet, so no conflict
      }

      const exists = source.some(
        p => p.seller_sku === value && (!isEdit || p.seller_sku !== formData.seller_sku)
      );
      setSkuExists(exists);
      if (exists) {
        setErrors(prev => ({ ...prev, seller_sku: 'SKU sudah ada' }));
      } else {
        setErrors(prev => ({ ...prev, seller_sku: '' }));
      }
    }

    if (name === 'style_name') {
      const source = allProducts;

      if (source.length === 0) {
        // No products yet
      }

      const exists = source.some(
        p => p.style_name === value && (!isEdit || p.style_name !== formData.style_name)
      );
      setStyleNameExists(exists);
      if (exists) {
        setErrors(prev => ({ ...prev, style_name: 'Nama style sudah ada' }));
      } else {
        setErrors(prev => ({ ...prev, style_name: '' }));
      }
    }
  };

  const calculateTotalStock = () => {
    const sizes = ['size_s', 'size_m', 'size_l', 'size_xl', 'size_xxl', 'size_xxxl', 'size_onesize'];
    return sizes.reduce((total, size) => total + (formData[size] || 0), 0);
  };

  const calculateNettReceive = () => {
    const { 
      price, 
      cost, 
      shipping_cost, 
      platform_commission, 
      discount, 
      tax, 
      admin_fee, 
      commission 
    } = formData;
    
    const totalCost = cost + shipping_cost + platform_commission + discount + tax + admin_fee + commission;
    return price - totalCost;
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        image.onload = () => {
          let width = image.width;
          let height = image.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Gagal kompres gambar'));
                return;
              }
              const compressedFile = new File([blob], file.name, { type: blob.type });
              resolve({ file: compressedFile, previewUrl: URL.createObjectURL(blob) });
            },
            'image/jpeg',
            quality
          );
        };
        image.onerror = reject;
        image.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    
    if (productImages.length >= 5) {
      alert('Maksimal 5 gambar per produk.');
      return;
    }

    try {
      const { file: compressedFile, previewUrl } = await compressImage(file);
      setProductImages(prev => [...prev, { 
        file: compressedFile, 
        previewUrl, 
        originalUrl: null, 
        isNew: true 
      }]);
    } catch (error) {
      console.error('Error compressing image:', error);
    }
    
    // Reset input so same file can be selected again if needed (after delete)
    e.target.value = '';
  };

  const removeImage = (indexToRemove) => {
    setProductImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.seller_sku.trim()) {
      newErrors.seller_sku = 'Seller SKU wajib diisi';
    } else if (skuExists) {
      newErrors.seller_sku = 'Seller SKU sudah ada';
    }

    if (!formData.style_name.trim()) {
      newErrors.style_name = 'Style Name wajib diisi';
    } else if (styleNameExists) {
      newErrors.style_name = 'Style Name sudah ada';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Kategori wajib diisi';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Harga harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasTriedSubmit(true);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle image uploads
      const uploadedImageUrls = [];
      
      for (const img of productImages) {
        if (img.isNew && img.file) {
          try {
            const url = await db.products.uploadImage(img.file);
            uploadedImageUrls.push(url);
          } catch (uploadErr) {
            console.error('Image upload failed:', uploadErr);
            alert('Gagal mengupload gambar. Pastikan bucket "product-images" sudah dibuat di Supabase (Public).');
            // Continue with other images or stop? Let's continue but maybe warn? 
            // For now, if one fails, we might just skip it or push null?
            // Let's skip it to avoid broken links.
          }
        } else {
          uploadedImageUrls.push(img.originalUrl);
        }
      }

      const finalImages = uploadedImageUrls.filter(url => url);
      const mainImageUrl = finalImages.length > 0 ? finalImages[0] : null;

      const total_stock = calculateTotalStock();
      const nett_receive = calculateNettReceive();
      
      // Determine ID if editing
      const productId = formData.id || (id ? parseInt(id, 10) : null);
      
      const productToSave = {
        ...formData,
        imageUrl: mainImageUrl, // Primary image for backward compatibility
        images: finalImages,    // All images
        id: productId,
        total_stock,
        nett_receive
      };
      
      // Remove id if it's falsy so db.js treats it as new
      if (!productToSave.id) delete productToSave.id;

      const savedProduct = await db.products.save(productToSave);

      if (isEdit) {
        const oldProduct = allProducts.find(p => p.id === productId);
        
        await addActivityLogEntry({
          action: 'Edit Product',
          item: `${savedProduct.style_name} (${savedProduct.seller_sku})`,
          oldVal: oldProduct ? `Harga Rp ${(oldProduct.price || 0).toLocaleString('id-ID')}, Stok ${oldProduct.total_stock || 0}` : 'Unknown',
          newVal: `Harga Rp ${(savedProduct.price || 0).toLocaleString('id-ID')}, Stok ${
            savedProduct.total_stock || 0
          }`,
          source: 'product'
        });
      } else {
        await addActivityLogEntry({
          action: 'Add Product',
          item: `${savedProduct.style_name} (${savedProduct.seller_sku})`,
          oldVal: '-',
          newVal: `Harga Rp ${(savedProduct.price || 0).toLocaleString('id-ID')}, Stok ${
            savedProduct.total_stock || 0
          }`,
          source: 'product'
        });
      }

      setIsSubmitting(false);
      navigate('/inventory');
    } catch (error) {
      console.error('Error saving product:', error);
      setIsSubmitting(false);
    }
  };

  const totalStock = calculateTotalStock();
  const nettReceive = calculateNettReceive();
  const statusOptions = ['Active', 'Update Price', 'Inactive'];

  const errorEntries = Object.entries(errors).filter(([, message]) => message);

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/inventory')}
          className="flex items-center text-gray-600 hover:text-gray-800 dark:text-navy-300 dark:hover:text-navy-100 mb-4 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Kembali ke Inventory
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800 dark:text-yellow-50">
          {isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h1>
        <p className="text-gray-600 dark:text-navy-200">
          {isEdit ? 'Edit detail produk' : 'Tambahkan produk baru ke inventory'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy-800 rounded-lg shadow-md p-6 border border-gray-100 dark:border-navy-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informasi Dasar</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Seller SKU *
                </label>
                <input
                  type="text"
                  name="seller_sku"
                  value={formData.seller_sku}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400 ${
                    errors.seller_sku ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                  }`}
                  placeholder="Contoh: TSH-BLK-001"
                />
                {errors.seller_sku && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.seller_sku}
                  </p>
                )}
                {formData.seller_sku && !errors.seller_sku && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle size={14} className="mr-1" />
                    SKU tersedia
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Shop SKU
                </label>
                <input
                  type="text"
                  name="shop_sku"
                  value={formData.shop_sku}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                  placeholder="Contoh: TSH001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Style Name *
                </label>
                <input
                  type="text"
                  name="style_name"
                  value={formData.style_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400 ${
                    errors.style_name ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                  }`}
                  placeholder="Contoh: Kaos Basic Hitam"
                />
                {errors.style_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.style_name}
                  </p>
                )}
                {formData.style_name && !errors.style_name && (
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle size={14} className="mr-1" />
                    Nama style tersedia
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Kategori *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white ${
                    errors.category ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                  }`}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Channel Distribusi
                </label>
                <select
                  name="distribution_channel"
                  value={formData.distribution_channel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
                >
                  <option value="">Pilih Channel</option>
                  {distributionChannels.map(channel => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Gambar Produk</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Gambar Produk (Maks 5)
                </label>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Render existing images */}
                  {productImages.map((img, index) => (
                    <div key={index} className="relative aspect-square border dark:border-navy-600 rounded-lg overflow-hidden group">
                      <img src={img.previewUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  {/* Render upload button if less than 5 */}
                  {productImages.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-navy-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors">
                      <Upload size={24} className="text-gray-400 dark:text-navy-400 mb-2" />
                      <span className="text-xs text-gray-500 dark:text-navy-300">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  {/* Render remaining empty slots */}
                  {[...Array(Math.max(0, 5 - productImages.length - 1))].map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border border-gray-200 dark:border-navy-700 rounded-lg bg-gray-50 dark:bg-navy-900 flex items-center justify-center">
                      <span className="text-xs text-gray-300 dark:text-navy-500">Kosong</span>
                    </div>
                  ))}
                </div>
                
                <p className="mt-2 text-xs text-gray-500 dark:text-navy-400">
                  Format: JPG, PNG. Maks 5 gambar. Gambar akan dikompres otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Informasi Harga</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Harga Jual (Rp) *
                </label>
                <input
                  type="text"
                  name="price"
                  value={formatRupiah(formData.price)}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400 ${
                    errors.price ? 'border-red-500' : 'border-gray-300 dark:border-navy-600'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Harga Cost (Rp)
                </label>
                <input
                  type="text"
                  name="cost"
                  value={formatRupiah(formData.cost)}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Biaya Pengiriman (Rp)
                </label>
                <input
                  type="text"
                  name="shipping_cost"
                  value={formatRupiah(formData.shipping_cost)}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200">
                    Komisi Platform
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleInputMode('platform_commission')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Input {inputModes.platform_commission === 'rp' ? 'Persen (%)' : 'Rupiah (Rp)'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="platform_commission"
                    value={inputModes.platform_commission === 'rp' ? formatRupiah(formData.platform_commission) : percentValues.platform_commission}
                    onChange={(e) => handleFinancialChange(e, 'platform_commission')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                    placeholder={inputModes.platform_commission === 'percent' ? '0' : '0'}
                  />
                  {inputModes.platform_commission === 'percent' && (
                    <span className="absolute right-3 top-2 text-gray-500 dark:text-navy-400">%</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200">
                    Diskon
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleInputMode('discount')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Input {inputModes.discount === 'rp' ? 'Persen (%)' : 'Rupiah (Rp)'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="discount"
                    value={inputModes.discount === 'rp' ? formatRupiah(formData.discount) : percentValues.discount}
                    onChange={(e) => handleFinancialChange(e, 'discount')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                    placeholder={inputModes.discount === 'percent' ? '0' : '0'}
                  />
                  {inputModes.discount === 'percent' && (
                    <span className="absolute right-3 top-2 text-gray-500 dark:text-navy-400">%</span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200">
                    Pajak
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleInputMode('tax')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Input {inputModes.tax === 'rp' ? 'Persen (%)' : 'Rupiah (Rp)'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="tax"
                    value={inputModes.tax === 'rp' ? formatRupiah(formData.tax) : percentValues.tax}
                    onChange={(e) => handleFinancialChange(e, 'tax')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                    placeholder={inputModes.tax === 'percent' ? '0' : '0'}
                  />
                  {inputModes.tax === 'percent' && (
                    <span className="absolute right-3 top-2 text-gray-500 dark:text-navy-400">%</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Biaya Admin (Rp)
                </label>
                <input
                  type="text"
                  name="admin_fee"
                  value={formatRupiah(formData.admin_fee)}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200">
                    Komisi
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleInputMode('commission')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                  >
                    Input {inputModes.commission === 'rp' ? 'Persen (%)' : 'Rupiah (Rp)'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="commission"
                    value={inputModes.commission === 'rp' ? formatRupiah(formData.commission) : percentValues.commission}
                    onChange={(e) => handleFinancialChange(e, 'commission')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                    placeholder={inputModes.commission === 'percent' ? '0' : '0'}
                  />
                  {inputModes.commission === 'percent' && (
                    <span className="absolute right-3 top-2 text-gray-500 dark:text-navy-400">%</span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-navy-900 p-3 rounded-lg border border-gray-200 dark:border-navy-700">
                <p className="text-sm font-medium text-gray-700 dark:text-navy-200">Nett Receive: </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  Rp {nettReceive.toLocaleString('id-ID')}
                </p>
                {onOpenCalculator && (
                  <button
                    type="button"
                    onClick={() => onOpenCalculator({
                      hpp: formData.cost,
                      sellingPrice: formData.price,
                      shippingCost: formData.shipping_cost,
                      platformCommission: formData.platform_commission,
                      discount: formData.discount,
                      tax: formData.tax
                    })}
                    className="mt-2 w-full bg-blue-600 dark:bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    <Calculator size={16} className="mr-2" />
                    Buka Kalkulator Profit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Size Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Stok per Ukuran</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Onesize'].map(size => (
              <div key={size}>
                <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
                  Size {size}
                </label>
                <input
                  type="number"
                  name={`size_${size.toLowerCase()}`}
                  value={formData[`size_${size.toLowerCase()}`]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
                  min="0"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 bg-blue-50 dark:bg-navy-900 p-3 rounded-lg border border-blue-100 dark:border-navy-700">
            <p className="text-sm font-medium text-gray-700 dark:text-navy-200">Total Stok: </p>
            <p className={`text-lg font-bold ${
              totalStock === 0 ? 'text-red-600 dark:text-red-400' : totalStock < 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
            }`}>
              {totalStock} pcs
            </p>
          </div>
        </div>

        {/* Status and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-2">
              Catatan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-navy-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-navy-900 dark:text-white dark:placeholder-navy-400"
              placeholder="Tambahkan catatan jika diperlukan..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
          {hasTriedSubmit && errorEntries.length > 0 && (
            <div className="relative group inline-flex items-center text-xs text-red-600 dark:text-red-400 cursor-default">
              <AlertCircle size={16} className="mr-1" />
              <span>Ada {errorEntries.length} field yang belum diisi dengan benar</span>
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-navy-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-3 text-xs text-gray-700 dark:text-navy-200 opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                <p className="font-semibold text-red-600 dark:text-red-400 mb-1">Perlu dicek:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errorEntries.map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="px-6 py-2 border border-gray-300 dark:border-navy-600 rounded-lg text-gray-700 dark:text-navy-200 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              <Save size={20} className="mr-2" />
              {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;