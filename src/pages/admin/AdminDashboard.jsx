import React, { useState, useEffect } from 'react';
import { useMenu } from '../../context/MenuContext';
import { useNavigate } from 'react-router-dom';
import OrderList from './components/OrderList';
import KanbanBoard from './components/KanbanBoard';
import AdminBlog from './components/AdminBlog';
import AdminRecipes from './components/AdminRecipes';
import AdminMessages from './components/AdminMessages';
import AdminRequests from './components/AdminRequests';
import AdminPromoCodes from './components/AdminPromoCodes';
import DriverApplications from './DriverApplications';
import AdminOperators from './components/AdminOperators';
import AdminLogs from './components/AdminLogs';
import OrderHistory from './components/OrderHistory';
import AdminDelivery from './components/AdminDelivery';
import AdminMenuPlanner from './components/AdminMenuPlanner';
import AdminSuppliers from './components/AdminSuppliers';
import AdminInventoryItems from './components/AdminInventoryItems';
import AdminReception from './components/AdminReception';
import AdminStock from './components/AdminStock';
import AdminTransfers from './components/AdminTransfers';
import AdminConsumption from './components/AdminConsumption';
import AdminInventoryCheck from './components/AdminInventoryCheck';
import AdminReports from './components/AdminReports';
import AdminLocations from './components/AdminLocations';
import AdminProcurement from './components/AdminProcurement';
import { Plus, Edit2, Trash2, LogOut, X, ArrowUp, ArrowDown, Check, FileText, Truck, Users, Box, BookOpen, UserCog, ClipboardList, History, BarChart2, MapPin, Calendar as CalendarIcon, CheckCircle, XCircle, CornerDownRight, ShoppingCart } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import './Admin.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const AdminDashboard = () => {
    const {
        products, categories, addProduct, updateProduct, deleteProduct, addCategory, deleteCategory, updateCategory, reorderCategory,
        bookedDates, toggleBooking,
        configuratorSteps, configuratorProducts, updateStep, addConfigProduct, updateConfigProduct, deleteConfigProduct,
        fetchRecommendations, addRecommendation, removeRecommendation,
        toggleCategoryVisibility
    } = useMenu();
    const [activeTab, setActiveTab] = useState('orders'); // Default to orders as it's common
    const navigate = useNavigate();

    // Role Management
    const [adminRole, setAdminRole] = useState(null);
    const [adminName, setAdminName] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('admin_role');
        const name = localStorage.getItem('admin_name');
        setAdminRole(role || 'operator'); // Default to operator if missing
        setAdminName(name || 'Admin');

        // Chef restriction: Force 'orders' tab
        if (role === 'chef') {
            setActiveTab('orders');
        } else {
            if (activeTab === 'orders' && role !== 'chef') {
                // Optimization: let users default to products if they want? 
                // For now, order list is good default.
            }
        }
    }, []);

    const canAccess = (tab) => {
        if (!adminRole) return false;
        if (adminRole === 'admin_app') return true; // Super admin

        // Grant Procurement access to everyone EXCEPT chef
        if (tab === 'procurement' && adminRole !== 'chef') return true;

        if (adminRole === 'contabil') {
            // Contabil needs reports, logs, inventory checks, suppliers, but maybe not products editing?
            // Giving broad access similar to operator but can be refined.
            // Allowed: Orders, Reports, Logs, Suppliers, Inventory, Locations
            const allowed = ['orders', 'reports', 'logs', 'inventory', 'suppliers', 'inventory_check', 'locations', 'reception', 'consumption'];
            return allowed.includes(tab) || tab === 'inventory';
        }

        if (adminRole === 'achizitor') {
            // Achizitor needs procurement flow logic
            // Allowed: Inventory stuff + PROCUREMENT
            const allowed = ['inventory', 'suppliers', 'inventory_items', 'reception', 'stock_live', 'transfers', 'consumption', 'inventory_check', 'locations', 'procurement'];
            return allowed.includes(tab) || tab === 'inventory';
        }

        if (adminRole === 'operator') {
            return true;
        }
        if (adminRole === 'chef') {
            return ['orders', 'recipes'].includes(tab);
        }
        return false;
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_name');
        navigate('/admin-login');
    };



    // Product State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [prodForm, setProdForm] = useState({ name: '', price: '', category: '', image: '', gallery: [], description: '', weight: '', ingredients: '' });

    const [activeProductTabType, setActiveProductTabType] = useState('delivery');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Category State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [catName, setCatName] = useState('');
    const [parentIdForAdd, setParentIdForAdd] = useState(null); // New state for subcategory parent
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCatNameValue, setEditCatNameValue] = useState('');
    const [activeTabType, setActiveTabType] = useState('delivery');

    const startEditingCategory = (cat) => {
        setEditingCategory(cat);
        setEditCatNameValue(cat.name);
    };

    const saveEditingCategory = () => {
        if (editingCategory && editCatNameValue.trim()) {
            updateCategory(editingCategory.id, { name: editCatNameValue });
            setEditingCategory(null);
            setEditCatNameValue('');
        }
    };

    const toggleCatVisibility = (id) => {
        toggleCategoryVisibility(id);
    };

    // Prepare to add: can match parentId or be root
    const openAddCategoryModal = (parentId = null) => {
        setParentIdForAdd(parentId);
        setCatName('');
        setIsCategoryModalOpen(true);
    };

    // Calendar State
    const [date, setDate] = useState(new Date());
    const [selectedVenue, setSelectedVenue] = useState('venetia');

    // Configurator State
    const [selectedStepId, setSelectedStepId] = useState(1);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [editingConfigProduct, setEditingConfigProduct] = useState(null);
    const [configForm, setConfigForm] = useState({ title: '', desc: '', fullDesc: '', image: '' });

    // Recommendation State
    const [currentRecommendations, setCurrentRecommendations] = useState([]);
    const [selectedRecId, setSelectedRecId] = useState("");

    // Image Preview State
    const [previewImage, setPreviewImage] = useState(null);

    // Handlers
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const productData = {
            ...prodForm,
            price: parseFloat(prodForm.price),
            id: editingProduct ? editingProduct.id : undefined // Let DB generate ID if new
        };

        if (editingProduct) {
            await updateProduct(editingProduct.id, productData);
            // Updating recommendations happens immediately in UI for existing products, 
            // but we could also batch save here if we changed logic. 
            // For now, existing logic saves immediately on add/remove.
        } else {
            const newProduct = await addProduct(productData);
            if (newProduct && currentRecommendations.length > 0) {
                // Batch insert recommendations for the new product
                for (const rec of currentRecommendations) {
                    await addRecommendation(newProduct.id, rec.id);
                }
            }
        }

        setProdForm({ name: '', price: '', category: '', image: '', gallery: [], description: '', weight: '', ingredients: '' });
        setEditingProduct(null);
        setIsProductModalOpen(false);
        setCurrentRecommendations([]);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        console.log("Adding Category:", { catName, activeTabType, parentIdForAdd });
        addCategory(catName, activeTabType, parentIdForAdd);
        setCatName('');
        setParentIdForAdd(null);
        setIsCategoryModalOpen(false);
    };

    const openProductModal = async (product = null) => {
        if (product) {
            setEditingProduct(product);
            setProdForm(product);
            // Fetch recommendations
            const recs = await fetchRecommendations(product.id);
            setCurrentRecommendations(recs);
        } else {
            setEditingProduct(null);
            setProdForm({ name: '', price: '', category: '', image: '', gallery: [], description: '', weight: '', ingredients: '' });
            setCurrentRecommendations([]);
        }
        setIsProductModalOpen(true);
    };

    const handleAddRec = async () => {
        if (!selectedRecId) return;

        const selectedProduct = products.find(p => p.id === parseInt(selectedRecId) || p.id === selectedRecId);
        if (!selectedProduct) return;

        if (editingProduct) {
            // Immediate save for existing products
            await addRecommendation(editingProduct.id, selectedRecId);
            // Refresh
            const recs = await fetchRecommendations(editingProduct.id);
            setCurrentRecommendations(recs);
        } else {
            // Local state only for new products
            // Prevent duplicates
            if (!currentRecommendations.some(r => r.id === selectedProduct.id)) {
                setCurrentRecommendations([...currentRecommendations, selectedProduct]);
            }
        }
        setSelectedRecId("");
    };

    const handleRemoveRec = async (recId) => {
        if (editingProduct) {
            await removeRecommendation(editingProduct.id, recId);
            setCurrentRecommendations(prev => prev.filter(r => r.id !== recId));
        } else {
            // Local state remove
            setCurrentRecommendations(prev => prev.filter(r => r.id !== recId));
        }
    };

    // ... (existing handlers)

    // Configurator Handlers
    const openConfigModal = (product = null) => {
        if (product) {
            setEditingConfigProduct(product);
            setConfigForm({
                title: product.title || product.name || '',
                desc: product.desc || product.description || '',
                fullDesc: product.fullDesc || product.full_description || '',
                image: product.image || ''
            });
        } else {
            setEditingConfigProduct(null);
            setConfigForm({ title: '', desc: '', fullDesc: '', image: '' });
        }
        setIsConfigModalOpen(true);
    };

    const handleConfigSubmit = (e) => {
        e.preventDefault();
        if (editingConfigProduct) {
            updateConfigProduct(selectedStepId, editingConfigProduct.id, configForm);
        } else {
            addConfigProduct(selectedStepId, configForm);
        }
        setIsConfigModalOpen(false);
    };

    const toggleAvailability = (product) => {
        const currentStatus = product.is_available !== false; // Default true if undefined
        updateProduct(product.id, { is_available: !currentStatus });
    };

    // Generic Image Upload Handler
    const handleImageUpload = async (e, setFormState) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Compress image to max 800px width and 0.7 quality
                const compressedBase64 = await compressImage(file, 800, 0.6);
                setFormState(prev => ({ ...prev, image: compressedBase64 }));
            } catch (error) {
                console.error("Error compressing image:", error);
                alert("A apărut o eroare la procesarea imaginii.");
            }
        }
    };

    return (
        <div className="admin-dashboard container">
            <div className="admin-header">
                <div className="admin-title">
                    <h1>Panou Administrare</h1>
                    <p>Bun venit, Operator</p>
                </div>
                <button className="btn-logout" onClick={handleLogout}>
                    <LogOut size={18} /> Deconectare
                </button>
            </div>

            <div className="admin-tabs">
                {canAccess('orders') && <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Comenzi</button>}
                {canAccess('products') && <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Produse</button>}
                {canAccess('categories') && <button className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>Categorii</button>}
                {canAccess('availability') && <button className={`tab-btn ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => setActiveTab('availability')}>Disponibilitate</button>}
                {canAccess('configurator') && <button className={`tab-btn ${activeTab === 'configurator' ? 'active' : ''}`} onClick={() => setActiveTab('configurator')}>Configurator</button>}
                {canAccess('recipes') && <button className={`tab-btn ${activeTab === 'recipes' ? 'active' : ''}`} onClick={() => setActiveTab('recipes')}>Rețete</button>}

                {/* ERP Nomenclatures */}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`} onClick={() => setActiveTab('suppliers')}>Furnizori</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`} onClick={() => setActiveTab('locations')}>Gestiuni</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'inventory_items' ? 'active' : ''}`} onClick={() => setActiveTab('inventory_items')}>Nomenclator Gestiune</button>}
                {canAccess('procurement') && <button className={`tab-btn ${activeTab === 'procurement' ? 'active' : ''}`} onClick={() => setActiveTab('procurement')}>Achiziții</button>}

                {/* ERP Operations */}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'reception' ? 'active' : ''}`} onClick={() => setActiveTab('reception')}>Recepție (NIR)</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'stock_live' ? 'active' : ''}`} onClick={() => setActiveTab('stock_live')}>Stocuri (Live)</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'transfers' ? 'active' : ''}`} onClick={() => setActiveTab('transfers')}>Transferuri</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'consumption' ? 'active' : ''}`} onClick={() => setActiveTab('consumption')}>Consum / Ieșiri</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'inventory_check' ? 'active' : ''}`} onClick={() => setActiveTab('inventory_check')}>Inventar Fizic</button>}
                {canAccess('inventory') && <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Rapoarte</button>}

                {canAccess('blog') && <button className={`tab-btn ${activeTab === 'blog' ? 'active' : ''}`} onClick={() => setActiveTab('blog')}>Blog</button>}
                {canAccess('messages') && <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>Mesaje Contact</button>}
                {canAccess('requests') && <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>Cereri</button>}

                {canAccess('products') && <button className={`tab-btn ${activeTab === 'planner' ? 'active' : ''}`} onClick={() => setActiveTab('planner')}>Planificator Meniu</button>}
                {canAccess('promo') && <button className={`tab-btn ${activeTab === 'delivery_zones' ? 'active' : ''}`} onClick={() => setActiveTab('delivery_zones')}>Livrare</button>}
                {canAccess('drivers') && <button className={`tab-btn ${activeTab === 'drivers_apps' ? 'active' : ''}`} onClick={() => setActiveTab('drivers_apps')}>Aplicații Livratori</button>}
                {canAccess('operators') && <button className={`tab-btn ${activeTab === 'operators' ? 'active' : ''}`} onClick={() => setActiveTab('operators')}>Operatori</button>}
                {canAccess('logs') && <button className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>Loguri</button>}
                {canAccess('history') && <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Istoric Comenzi</button>}
            </div>

            <div className="tab-content-container">
                {/* PROMO CODES TAB */}
                {activeTab === 'promocodes' && (
                    <div className="tab-content">
                        <AdminPromoCodes />
                    </div>
                )}
                {/* OPERATORS TAB */}
                {activeTab === 'operators' && (
                    <div className="tab-content">
                        <AdminOperators />
                    </div>
                )}
                {/* LOGS TAB */}
                {activeTab === 'logs' && (
                    <div className="tab-content">
                        <AdminLogs />
                    </div>
                )}
                {/* SUPPLIERS TAB */}
                {activeTab === 'suppliers' && (
                    <div className="tab-content">
                        <AdminSuppliers />
                    </div>
                )}
                {/* INVENTORY ITEMS TAB */}
                {activeTab === 'inventory_items' && (
                    <div className="tab-content">
                        <AdminInventoryItems />
                    </div>
                )}
                {/* RECEPTION (NIR) TAB */}
                {activeTab === 'reception' && (
                    <div className="tab-content">
                        <AdminReception />
                    </div>
                )}
                {/* STOCK LIVE TAB */}
                {activeTab === 'stock_live' && (
                    <div className="tab-content">
                        <AdminStock />
                    </div>
                )}
                {/* TRANSFERS TAB */}
                {activeTab === 'transfers' && (
                    <div className="tab-content">
                        <AdminTransfers />
                    </div>
                )}
                {/* CONSUMPTION TAB */}
                {activeTab === 'consumption' && (
                    <div className="tab-content">
                        <AdminConsumption />
                    </div>
                )}
                {/* INVENTORY CHECK TAB */}
                {activeTab === 'inventory_check' && (
                    <div className="tab-content">
                        <AdminInventoryCheck />
                    </div>
                )}
                {/* LOCATIONS TAB */}
                {activeTab === 'locations' && (
                    <div className="tab-content">
                        <AdminLocations />
                    </div>
                )}
                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <div className="tab-content">
                        <AdminReports />
                    </div>
                )}
                {/* DELIVERY ZONES TAB */}
                {activeTab === 'delivery_zones' && (
                    <div className="tab-content">
                        <AdminDelivery />
                    </div>
                )}
                {/* MENU PLANNER TAB */}
                {activeTab === 'planner' && (
                    <div className="tab-content">
                        <AdminMenuPlanner />
                    </div>
                )}
                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="tab-content">
                        <OrderHistory />
                    </div>
                )}
                {/* MESSAGES TAB */}
                {activeTab === 'messages' && (
                    <div className="tab-content">
                        <AdminMessages />
                    </div>
                )}
                {/* REQUESTS TAB */}
                {activeTab === 'requests' && (
                    <div className="tab-content">
                        <AdminRequests />
                    </div>
                )}
                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="tab-content">
                        <OrderList />
                        <div style={{ margin: '2rem 0', borderTop: '2px solid #ddd' }}></div>
                        <h3 className="mb-4 text-xl font-bold">Flux Comenzi</h3>
                        <KanbanBoard />
                    </div>
                )}

                {/* PRODUCTS TAB */}
                {activeTab === 'products' && (
                    <div className="tab-content">
                        <div className="category-type-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <button
                                className={`btn ${activeProductTabType === 'delivery' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveProductTabType('delivery')}
                                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <Truck size={16} style={{ marginRight: '8px' }} /> Livrări
                            </button>
                            <button
                                className={`btn ${activeProductTabType === 'catering' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveProductTabType('catering')}
                                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <Users size={16} style={{ marginRight: '8px' }} /> Catering
                            </button>
                        </div>

                        <div className="actions-bar">
                            <button className="btn btn-primary" onClick={() => openProductModal()}>
                                <Plus size={18} /> Adaugă Produs ({activeProductTabType === 'delivery' ? 'Livrări' : 'Catering'})
                            </button>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="search-filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <input
                                    type="text"
                                    placeholder="Caută produs după nume..."
                                    className="form-control"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div style={{ minWidth: '200px' }}>
                                <select
                                    className="form-control"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Toate Categoriile</option>
                                    {categories
                                        .filter(c => (!c.type || c.type === 'delivery') === (activeProductTabType === 'delivery'))
                                        .map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Imagine</th>
                                        <th>Nume</th>
                                        <th>Preț</th>
                                        <th>Categorie</th>
                                        <th>Disponibil</th>
                                        <th>Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products
                                        .filter(p => {
                                            const cat = categories.find(c => c.name === p.category);
                                            // 1. Filter by Type (Delivery/Catering)
                                            const type = cat ? (cat.type || 'delivery') : 'delivery';
                                            if (type !== activeProductTabType) return false;

                                            // 2. Filter by Category Select
                                            if (filterCategory && p.category !== filterCategory) return false;

                                            // 3. Filter by Search Term
                                            if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

                                            return true;
                                        })
                                        .map(product => (
                                            <tr key={product.id}>
                                                <td>
                                                    <img
                                                        src={product.image || 'https://via.placeholder.com/50'}
                                                        alt={product.name}
                                                        className="product-thumb"
                                                        onClick={() => setPreviewImage(product.image)}
                                                    />
                                                </td>
                                                <td>{product.name}</td>
                                                <td>{product.price} Lei</td>
                                                <td>{product.category}</td>
                                                <td>
                                                    <label className="switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={product.is_available !== false}
                                                            onChange={() => toggleAvailability(product)}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <button className="btn-icon edit" onClick={() => openProductModal(product)}><Edit2 size={18} /></button>
                                                        <button className="btn-icon delete" onClick={() => deleteProduct(product.id)}><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {products.filter(p => {
                                        const cat = categories.find(c => c.name === p.category);
                                        const type = cat ? (cat.type || 'delivery') : 'delivery';
                                        if (type !== activeProductTabType) return false;
                                        if (filterCategory && p.category !== filterCategory) return false;
                                        if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                                        return true;
                                    }).length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                                    Nu există produse de {activeProductTabType} adăugate.
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* CATEGORIES TAB */}
                {activeTab === 'categories' && (
                    <div className="tab-content">
                        <div className="category-type-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <button
                                className={`btn ${activeTabType === 'delivery' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTabType('delivery')}
                                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <Truck size={16} style={{ marginRight: '8px' }} /> Livrări
                            </button>
                            <button
                                className={`btn ${activeTabType === 'catering' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTabType('catering')}
                                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <Users size={16} style={{ marginRight: '8px' }} /> Catering
                            </button>
                            <button
                                className={`btn ${activeTabType === 'inventory_check' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTabType('inventory_check')}
                                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <ClipboardList size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Inventar Fizic
                            </button>
                            <button
                                className={`btn ${activeTabType === 'reports' ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTabType('reports')}
                                style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                            >
                                <BarChart2 size={18} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Rapoarte
                            </button>
                        </div>

                        <div className="actions-bar">
                            <button className="btn btn-primary" onClick={() => openAddCategoryModal(null)}>
                                <Plus size={18} /> Adaugă Categorie ({activeTabType === 'delivery' ? 'Livrări' : 'Catering'})
                            </button>
                        </div>
                        <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#e2e8f0', borderRadius: '4px', fontWeight: 'bold' }}>
                            Structură Ierarhică Categorii
                        </div>
                        <div className="categories-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(() => {
                                const filteredCats = categories.filter(cat => (cat.type || 'delivery') === activeTabType);

                                // Build Tree with Orphan Handling
                                const buildTree = (cats) => {
                                    const map = {};
                                    const roots = [];
                                    cats.forEach(c => map[c.id] = { ...c, children: [] });
                                    cats.forEach(c => {
                                        if (c.parent_id && map[c.parent_id]) {
                                            map[c.parent_id].children.push(map[c.id]);
                                        } else {
                                            // Treated as root if no parent OR parent not in current filter
                                            roots.push(map[c.id]);
                                        }
                                    });
                                    // Sort by sort_order if available, else name
                                    return roots.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                                };

                                const tree = buildTree(filteredCats);

                                const renderNode = (node, level = 0) => (
                                    <div key={node.id} style={{ marginBottom: '1rem', width: '100%' }}>
                                        {/* Main Category Card */}
                                        <div className="category-card" style={{
                                            display: 'flex',
                                            flexDirection: 'column', // Allow children to be inside/below
                                            background: 'white',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            overflow: 'hidden'
                                        }}>
                                            {/* Header / Main Row */}
                                            <div className="cat-header-row" style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '1rem',
                                                gap: '1rem',
                                                background: level === 0 ? 'white' : '#f8fafc',
                                                borderBottom: node.children && node.children.length > 0 ? '1px solid #eee' : 'none'
                                            }}>
                                                <div className="cat-order" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '24px' }}>
                                                    <button type="button" className="btn-icon" onClick={() => reorderCategory(node.id, 'up')} title="Mută sus" style={{ padding: '2px', height: 'auto' }}>
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button type="button" className="btn-icon" onClick={() => reorderCategory(node.id, 'down')} title="Mută jos" style={{ padding: '2px', height: 'auto' }}>
                                                        <ArrowDown size={14} />
                                                    </button>
                                                </div>

                                                <div className="cat-content" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {/* Visibility Toggle */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCatVisibility(node.id)}
                                                        title={node.is_visible !== false ? "Vizibil" : "Ascuns"}
                                                        style={{ border: 'none', background: 'none', color: node.is_visible !== false ? 'green' : '#cbd5e1', cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        {node.is_visible !== false ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                    </button>

                                                    {editingCategory && editingCategory.id === node.id ? (
                                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                value={editCatNameValue}
                                                                onChange={(e) => setEditCatNameValue(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button className="btn-icon" style={{ color: 'green' }} onClick={saveEditingCategory} title="Salvează"><Check size={20} /></button>
                                                            <button className="btn-icon" style={{ color: 'red' }} onClick={() => setEditingCategory(null)} title="Anulează"><X size={20} /></button>
                                                        </div>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: level === 0 ? '1.1rem' : '1rem',
                                                            fontWeight: level === 0 ? '600' : '500',
                                                            color: node.is_visible === false ? '#94a3b8' : 'inherit',
                                                            flex: 1
                                                        }}>
                                                            {node.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="cat-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {editingCategory?.id !== node.id && (
                                                        <>
                                                            <button className="btn-icon" style={{ color: '#2563eb' }} onClick={() => openAddCategoryModal(node.id)} title="Adaugă Subcategorie"><Plus size={18} /></button>
                                                            <button className="btn-icon edit" onClick={() => startEditingCategory(node)} title="Editează Nume"><Edit2 size={18} /></button>
                                                            <button className="btn-icon delete" onClick={() => deleteCategory(node.name)} title="Șterge"><Trash2 size={18} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Subcategories Area - "Tabs" Look */}
                                            {node.children && node.children.length > 0 && (
                                                <div className="cat-children-container" style={{
                                                    background: '#f1f5f9',
                                                    padding: '1rem 1rem 1rem 3rem', // Indent content
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.5rem'
                                                }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <CornerDownRight size={14} /> SUBCATEGORII
                                                    </div>
                                                    {node.children.map(child => renderNode(child, level + 1))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );

                                if (tree.length === 0) return (
                                    <div style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                                        Nu există categorii de {activeTabType} definite.
                                    </div>
                                );

                                return tree.map(node => renderNode(node));
                            })()}
                            {/* Removed old flat list */}
                        </div>
                    </div>
                )}

                {/* BLOG TAB */}
                {activeTab === 'blog' && (
                    <div className="tab-content">
                        <AdminBlog />
                    </div>
                )}



                {/* RECIPES TAB */}
                {activeTab === 'recipes' && (
                    <div className="tab-pane">
                        <AdminRecipes />
                    </div>
                )}



                {/* DRIVER APPS TAB */}
                {activeTab === 'drivers_apps' && (
                    <div className="tab-content">
                        <DriverApplications />
                    </div>
                )}

                {/* AVAILABILITY TAB */}
                {activeTab === 'availability' && (
                    <div className="tab-content centered-tab">
                        <div className="availability-wrapper">
                            <h3>Gestionează Disponibilitatea</h3>
                            <p className="instruction-text">Selectează o dată din calendar pentru a o marca ca REZERVATĂ sau DISPONIBILĂ.</p>

                            <div className="venue-selector">
                                <label>Alege Salonul:</label>
                                <select value={selectedVenue} onChange={(e) => setSelectedVenue(e.target.value)}>
                                    <option value="venetia">Salon Veneția</option>
                                    <option value="roma">Salon Roma</option>
                                    <option value="florenta">Salon Florența</option>
                                </select>
                            </div>

                            <div className="calendar-admin-container">
                                <Calendar
                                    onChange={setDate}
                                    value={date}
                                    onClickDay={(value) => {
                                        const offset = value.getTimezoneOffset();
                                        const d = new Date(value.getTime() - (offset * 60 * 1000));
                                        const dateStr = d.toISOString().split('T')[0];
                                        toggleBooking(selectedVenue, dateStr);
                                    }}
                                    tileClassName={({ date, view }) => {
                                        if (view === 'month') {
                                            const offset = date.getTimezoneOffset();
                                            const d = new Date(date.getTime() - (offset * 60 * 1000));
                                            const dateStr = d.toISOString().split('T')[0];
                                            const isBooked = (bookedDates[selectedVenue] || []).includes(dateStr);
                                            return isBooked ? 'calendar-booked' : 'calendar-available';
                                        }
                                    }}
                                    locale="ro-RO"
                                />
                            </div>

                            <div className="legend">
                                <span className="legend-item"><span className="dot available"></span> Disponibil</span>
                                <span className="legend-item"><span className="dot booked"></span> Rezervat</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CONFIGURATOR TAB */}
            {activeTab === 'configurator' && (
                <div className="tab-pane">
                    <div className="venue-selector-compact mb-3">
                        <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>Alege Etapa:</label>
                        <select
                            className="form-control"
                            style={{ maxWidth: '300px', display: 'inline-block' }}
                            value={selectedStepId}
                            onChange={(e) => setSelectedStepId(Number(e.target.value))}
                        >
                            {configuratorSteps.map(step => (
                                <option key={step.id} value={step.id}>{step.id}. {step.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="actions-bar mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Produse pentru: {configuratorSteps.find(s => s.id === selectedStepId)?.title}</h3>
                        <button className="btn btn-primary" onClick={() => openConfigModal()}>
                            <Plus size={18} /> Adaugă Produs
                        </button>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Img</th>
                                    <th>Nume Produs</th>
                                    <th>Descriere Scurtă</th>
                                    <th>Acțiuni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(configuratorProducts[selectedStepId] || []).map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <img
                                                src={p.image || 'https://via.placeholder.com/50'}
                                                alt={p.title}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'zoom-in' }}
                                                onClick={() => setPreviewImage(p.image)}
                                            />
                                        </td>
                                        <td>{p.title || p.name}</td>
                                        <td><small>{p.desc || p.description}</small></td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="btn-icon edit" onClick={() => openConfigModal(p)} title="Editează"><Edit2 size={18} /></button>
                                                <button className="btn-icon delete" onClick={() => deleteConfigProduct(selectedStepId, p.id)} title="Șterge"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(configuratorProducts[selectedStepId] || []).length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>Nu există produse în această etapă.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ... other modals ... */}

            {/* CONFIGURATOR MODAL */}
            {isConfigModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingConfigProduct ? 'Editează Produs Configurator' : 'Adaugă Produs Nou'}</h3>
                            <button className="close-btn" onClick={() => setIsConfigModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleConfigSubmit}>
                            <div className="form-group">
                                <label>Nume Produs</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configForm.title}
                                    onChange={e => setConfigForm({ ...configForm, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Imagine (URL sau Upload)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control"
                                        onChange={(e) => handleImageUpload(e, setConfigForm)}
                                        style={{ width: 'auto' }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configForm.image}
                                    onChange={e => setConfigForm({ ...configForm, image: e.target.value })}
                                    placeholder="https://..."
                                />
                                {configForm.image && (
                                    <img
                                        src={configForm.image}
                                        alt="Preview"
                                        style={{ width: '80px', height: '80px', marginTop: '10px', borderRadius: '4px', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #ddd' }}
                                        onClick={() => setPreviewImage(configForm.image)}
                                    />
                                )}
                            </div>
                            <div className="form-group">
                                <label>Descriere Scurtă</label>
                                <textarea
                                    className="form-control"
                                    value={configForm.desc}
                                    onChange={e => setConfigForm({ ...configForm, desc: e.target.value })}
                                    rows="2"
                                />
                            </div>
                            <div className="form-group">
                                <label>Descriere Completă</label>
                                <textarea
                                    className="form-control"
                                    value={configForm.fullDesc}
                                    onChange={e => setConfigForm({ ...configForm, fullDesc: e.target.value })}
                                    rows="4"
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">
                                {editingConfigProduct ? 'Salvează Modificările' : 'Adaugă Produs'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* PRODUCT MODAL (Existing) */}
            {isProductModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingProduct ? 'Editează Produs' : 'Adaugă Produs Nou'}</h3>
                            <button className="close-btn" onClick={() => setIsProductModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleProductSubmit}>
                            <div className="form-group">
                                <label>Nume Produs</label>
                                <input type="text" className="form-control" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} required />
                            </div>
                            <div className="form-row two-cols">
                                <div className="form-group">
                                    <label>Preț (Lei)</label>
                                    <input type="number" step="0.01" className="form-control" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Categorie</label>
                                    <select className="form-control" value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })} required>
                                        <option value="">Alege Categorie</option>
                                        <optgroup label="Livrări">
                                            {categories.filter(c => (!c.type || c.type === 'delivery')).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Catering">
                                            {categories.filter(c => c.type === 'catering').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Imagine (URL sau Upload)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="form-control"
                                        onChange={(e) => handleImageUpload(e, setProdForm)}
                                        style={{ width: 'auto' }}
                                    />
                                </div>
                                <input type="text" className="form-control" value={prodForm.image} onChange={e => setProdForm({ ...prodForm, image: e.target.value })} required />
                                {prodForm.image && (
                                    <img
                                        src={prodForm.image}
                                        alt="Preview"
                                        style={{ width: '80px', height: '80px', marginTop: '10px', borderRadius: '4px', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid #ddd' }}
                                        onClick={() => setPreviewImage(prodForm.image)}
                                    />
                                )}
                            </div>

                            {/* GALLERY SECTION */}
                            <div className="form-group">
                                <label>Galerie Imagini (Secundare)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="form-control"
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files);
                                            for (const file of files) {
                                                try {
                                                    const base64 = await compressImage(file, 800, 0.6);
                                                    setProdForm(prev => ({
                                                        ...prev,
                                                        gallery: [...(prev.gallery || []), base64]
                                                    }));
                                                } catch (err) {
                                                    console.error("Error uploading gallery image", err);
                                                }
                                            }
                                        }}
                                        style={{ width: 'auto' }}
                                    />
                                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Max 800px</span>
                                </div>
                                <div className="gallery-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                    {(prodForm.gallery || []).map((img, idx) => (
                                        <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                            <img
                                                src={img}
                                                alt={`Gallery ${idx}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', cursor: 'zoom-in' }}
                                                onClick={() => setPreviewImage(img)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProdForm(prev => ({
                                                        ...prev,
                                                        gallery: prev.gallery.filter((_, i) => i !== idx)
                                                    }));
                                                }}
                                                style={{
                                                    position: 'absolute', top: -5, right: -5,
                                                    background: 'red', color: 'white', borderRadius: '50%',
                                                    width: '20px', height: '20px', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                                                }}
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Descriere</label>
                                <textarea className="form-control" rows="3" value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} required></textarea>
                            </div>
                            <div className="form-row two-cols">
                                <div className="form-group">
                                    <label>Gramaj</label>
                                    <input type="text" className="form-control" value={prodForm.weight} onChange={e => setProdForm({ ...prodForm, weight: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Ingrediente</label>
                                    <input type="text" className="form-control" value={prodForm.ingredients} onChange={e => setProdForm({ ...prodForm, ingredients: e.target.value })} />
                                </div>
                            </div>


                            {/* RECOMMENDATIONS SECTION (Available for New and Edit) */}
                            <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>Produse Recomandate (Extra)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <select
                                        className="form-control"
                                        value={selectedRecId}
                                        onChange={(e) => setSelectedRecId(e.target.value)}
                                    >
                                        <option value="">Alege un produs...</option>
                                        {products
                                            .filter(p => !editingProduct || p.id !== editingProduct.id) // Exclude self if editing
                                            .filter(p => !currentRecommendations.some(r => r.id === p.id)) // Exclude already added
                                            .sort((a, b) => a.name.localeCompare(b.name))
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.price} Lei)</option>
                                            ))
                                        }
                                    </select>
                                    <button type="button" className="btn btn-primary" onClick={handleAddRec} disabled={!selectedRecId}>
                                        <Plus size={18} />
                                    </button>
                                </div>

                                {/* List of current recommendations */}
                                <div className="recommendations-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {currentRecommendations.map(rec => (
                                        <div key={rec.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            background: '#f8f9fa',
                                            padding: '5px 10px',
                                            borderRadius: '20px',
                                            fontSize: '0.9rem',
                                            border: '1px solid #dee2e6'
                                        }}>
                                            <span>{rec.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRec(rec.id)}
                                                style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {currentRecommendations.length === 0 && <small className="text-muted">Niciun produs recomandat.</small>}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-block mt-2">Salvează</button>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY MODAL */}
            {isCategoryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{parentIdForAdd ? 'Adaugă Subcategorie' : `Adaugă Categorie (${activeTabType === 'delivery' ? 'Livrări' : 'Catering'})`}</h3>
                            <button className="close-btn" onClick={() => setIsCategoryModalOpen(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="form-group">
                                <label>Nume Categorie</label>
                                <input type="text" className="form-control" value={catName} onChange={e => setCatName(e.target.value)} required />
                                <small className="text-muted">Categorie pentru secțiunea: <strong>{activeTabType.toUpperCase()}</strong></small>
                            </div>
                            <button type="submit" className="btn btn-primary btn-block mt-2">Adaugă</button>
                        </form>
                    </div>
                </div>
            )}
            {/* IMAGE PREVIEW LIGHTBOX */}
            {previewImage && (
                <div className="lightbox-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setPreviewImage(null)}>&times;</button>
                        <img src={previewImage} alt="Preview" className="lightbox-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
