import React, { useState, useEffect } from 'react';
import AdminPOS from './components/AdminPOS';
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
import AdminInventoryObjects from './components/AdminInventoryObjects';
import { Plus, Edit2, Trash2, Copy, LogOut, X, ArrowUp, ArrowDown, Check, FileText, Truck, Users, Box, BookOpen, UserCog, ClipboardList, History, BarChart2, MapPin, Calendar as CalendarIcon, CheckCircle, XCircle, CornerDownRight, ShoppingCart, Settings, Search } from 'lucide-react';
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
        fetchExtras, addExtra, removeExtra, // Added Extras
        toggleCategoryVisibility
    } = useMenu();
    const [activeTab, setActiveTab] = useState('orders'); // Default to orders as it's common
    const navigate = useNavigate();

    // Role Management
    const [adminRole, setAdminRole] = useState(null);
    const [adminName, setAdminName] = useState('');

    // --- MOBILE PREFS ---
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 1024;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(true);
            else setIsSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const role = localStorage.getItem('admin_role');
        const name = localStorage.getItem('admin_name');
        setAdminRole(role || 'operator');
        setAdminName(name || 'Admin');

        if (role === 'chef') {
            setActiveTab('orders');
        }
        if (role === 'cost_productie') {
            setActiveTab('recipes');
        }
    }, []);

    // Navigation Config
    const NAV_ITEMS = [
        { id: 'pos', label: 'POS / Ospătar', icon: ShoppingCart, permission: 'orders' },
        { id: 'orders', label: 'Comenzi', icon: ClipboardList, permission: 'orders' },
        { id: 'products', label: 'Produse', icon: Box, permission: 'products' },
        { id: 'categories', label: 'Categorii', icon: ClipboardList, permission: 'categories' },
        { id: 'availability', label: 'Disponibilitate', icon: CheckCircle, permission: 'availability' },
        { id: 'configurator', label: 'Configurator', icon: Settings, permission: 'configurator' },
        { id: 'recipes', label: 'Rețete', icon: BookOpen, permission: 'recipes' },

        { header: 'ERP Nomenclatoare' },
        { id: 'suppliers', label: 'Furnizori', icon: Users, permission: 'suppliers' },
        { id: 'locations', label: 'Gestiuni', icon: MapPin, permission: 'locations' },
        { id: 'inventory_items', label: 'Nomenclator Gestiune', icon: Box, permission: 'inventory_items' },
        { id: 'inventory_objects', label: 'Obiecte de Inventar', icon: Box, permission: 'inventory_objects' },
        { id: 'procurement', label: 'Achiziții', icon: ShoppingCart, permission: 'procurement' },

        { header: 'ERP Operațiuni' },
        { id: 'reception', label: 'Recepție (NIR)', icon: FileText, permission: 'inventory' },
        { id: 'stock_live', label: 'Stocuri (Live)', icon: BarChart2, permission: 'inventory' },
        { id: 'transfers', label: 'Transferuri', icon: ArrowUp, permission: 'inventory' },
        { id: 'consumption', label: 'Consum / Ieșiri', icon: ArrowDown, permission: 'inventory' },
        { id: 'inventory_check', label: 'Inventar Fizic', icon: Check, permission: 'inventory' },
        { id: 'reports', label: 'Rapoarte', icon: FileText, permission: 'inventory' },

        { header: 'Website' },
        { id: 'blog', label: 'Blog', icon: FileText, permission: 'blog' },
        { id: 'messages', label: 'Mesaje Contact', icon: Users, permission: 'messages' },
        { id: 'requests', label: 'Cereri', icon: FileText, permission: 'requests' },

        { header: 'Administrare' },
        { id: 'events', label: 'Evenimente', icon: CalendarIcon, permission: 'orders' },
        { id: 'planner', label: 'Planificator Meniu', icon: CalendarIcon, permission: 'products' },
        { id: 'delivery_zones', label: 'Livrare', icon: Truck, permission: 'promo' },
        { id: 'drivers_apps', label: 'Aplicații Livratori', icon: Truck, permission: 'drivers' },
        { id: 'operators', label: 'Operatori', icon: Users, permission: 'operators' },
        { id: 'logs', label: 'Loguri', icon: History, permission: 'logs' },
        { id: 'history', label: 'Istoric Comenzi', icon: History, permission: 'history' },
        { id: 'promocodes', label: 'Coduri Promoționale', icon: Settings, permission: 'promo' }, // Added explicit promo codes if needed
    ];

    const canAccess = (tab) => {
        if (!adminRole) return false;
        if (adminRole === 'admin_app') return true; // Super admin

        if (adminRole === 'contabil') {
            // Allowed: Orders, Reports, Logs, Suppliers, Inventory, Locations
            const allowed = ['orders', 'reports', 'logs', 'inventory', 'suppliers', 'inventory_check', 'locations', 'reception', 'consumption'];
            return allowed.includes(tab) || tab === 'inventory';
        }

        if (adminRole === 'achizitor') {
            // Achizitor needs procurement flow logic
            const allowed = ['inventory', 'suppliers', 'inventory_items', 'reception', 'stock_live', 'transfers', 'consumption', 'inventory_check', 'locations', 'procurement', 'inventory_objects', 'recipes'];
            return allowed.includes(tab) || tab === 'inventory';
        }

        if (adminRole === 'gestionar') {
            const allowed = ['suppliers', 'locations', 'inventory_items', 'inventory_objects'];
            return allowed.includes(tab);
        }

        if (adminRole === 'operator') {
            return true;
        }
        if (adminRole === 'chef') {
            return ['orders', 'recipes'].includes(tab);
        }
        if (adminRole === 'cost_productie') {
            // Explicitly deny procurement if needed, though default is false
            return ['recipes'].includes(tab);
        }
        return false;
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_name');
        navigate('/admin/login');
    };

    // --- RESTORED HANDLERS & STATE ---

    // Product State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [prodForm, setProdForm] = useState({ name: '', price: '', category: '', image: '', gallery: [], production_gallery: [], internal_instructions: '', description: '', weight: '', allergens: '', ingredients: '', product_options: [] });

    const [activeProductTabType, setActiveProductTabType] = useState('catering');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    // Category State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [catName, setCatName] = useState('');
    const [parentIdForAdd, setParentIdForAdd] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCatNameValue, setEditCatNameValue] = useState('');
    const [activeTabType, setActiveTabType] = useState('catering');

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
    const [recSearchTerm, setRecSearchTerm] = useState("");

    // Extras State
    const [currentExtras, setCurrentExtras] = useState([]);
    const [extraSearchTerm, setExtraSearchTerm] = useState("");

    // Image Preview State
    const [previewImage, setPreviewImage] = useState(null);

    // Handlers
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const productData = {
            ...prodForm,
            price: parseFloat(prodForm.price),
            id: editingProduct ? editingProduct.id : undefined
        };

        if (editingProduct) {
            await updateProduct(editingProduct.id, productData);
        } else {
            const newProduct = await addProduct(productData);
            if (newProduct && currentRecommendations.length > 0) {
                for (const rec of currentRecommendations) {
                    await addRecommendation(newProduct.id, rec.id);
                }
            }
            if (newProduct && currentExtras.length > 0) {
                for (const extra of currentExtras) {
                    await addExtra(newProduct.id, extra.id);
                }
            }
        }


        setProdForm({ name: '', price: '', category: '', image: '', gallery: [], production_gallery: [], internal_instructions: '', description: '', weight: '', allergens: '', ingredients: '', product_options: [] });
        setEditingProduct(null);
        setIsProductModalOpen(false);
        setCurrentRecommendations([]);
        setCurrentExtras([]);
    };

    const handleCategorySubmit = (e) => {
        e.preventDefault();
        addCategory(catName, activeTabType, parentIdForAdd);
        setCatName('');
        setParentIdForAdd(null);
        setIsCategoryModalOpen(false);
    };

    const [focusedOption, setFocusedOption] = useState(null); // { gIdx, cIdx }

    const openProductModal = async (product = null) => {
        if (product) {
            setEditingProduct(product);
            setProdForm(product);
            const recs = await fetchRecommendations(product.id);
            setCurrentRecommendations(recs);
            const extras = await fetchExtras(product.id);
            setCurrentExtras(extras);
        } else {
            setEditingProduct(null);
            setProdForm({ name: '', price: '', category: '', image: '', gallery: [], production_gallery: [], internal_instructions: '', description: '', weight: '', allergens: '', ingredients: '', product_options: [] });
            setCurrentRecommendations([]);
            setCurrentExtras([]);
        }
        setIsProductModalOpen(true);
    };

    const duplicateProduct = async (product) => {
        const { id, created_at, ...prodData } = product;
        const duplicated = {
            ...prodData,
            name: product.name + ' (copie)',
            is_available: true
        };
        const newProd = await addProduct(duplicated);
        if (newProd) {
            openProductModal(newProd);
        }
    };

    const handleSelectRec = async (product) => {
        if (!product) return;
        if (editingProduct) {
            await addRecommendation(editingProduct.id, product.id);
            const recs = await fetchRecommendations(editingProduct.id);
            setCurrentRecommendations(recs);
        } else {
            if (!currentRecommendations.some(r => r.id === product.id)) {
                setCurrentRecommendations([...currentRecommendations, product]);
            }
        }
        setRecSearchTerm("");
    };

    const handleRemoveRec = async (recId) => {
        if (editingProduct) {
            await removeRecommendation(editingProduct.id, recId);
            setCurrentRecommendations(prev => prev.filter(r => r.id !== recId));
        } else {
            setCurrentRecommendations(prev => prev.filter(r => r.id !== recId));
        }
    };

    const handleSelectExtra = async (product) => {
        if (!product) return;
        if (editingProduct) {
            await addExtra(editingProduct.id, product.id);
            const extras = await fetchExtras(editingProduct.id);
            setCurrentExtras(extras);
        } else {
            if (!currentExtras.some(r => r.id === product.id)) {
                setCurrentExtras([...currentExtras, product]);
            }
        }
        setExtraSearchTerm("");
    };

    const handleRemoveExtra = async (extraId) => {
        if (editingProduct) {
            await removeExtra(editingProduct.id, extraId);
            setCurrentExtras(prev => prev.filter(r => r.id !== extraId));
        } else {
            setCurrentExtras(prev => prev.filter(r => r.id !== extraId));
        }
    };

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
        const currentStatus = product.is_available !== false;
        updateProduct(product.id, { is_available: !currentStatus });
    };

    const handleImageUpload = async (e, setFormState) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 800, 0.6);
                setFormState(prev => ({ ...prev, image: compressedBase64 }));
            } catch (error) {
                console.error("Error compressing image:", error);
                alert("A apărut o eroare la procesarea imaginii.");
            }
        }
    };

    // --- OPTION MANAGEMENT HELPERS ---
    const addOptionGroup = () => {
        setProdForm(prev => ({
            ...prev,
            product_options: [...(prev.product_options || []), { name: '', choices: [] }]
        }));
    };

    const removeOptionGroup = (idx) => {
        setProdForm(prev => ({
            ...prev,
            product_options: prev.product_options.filter((_, i) => i !== idx)
        }));
    };

    const updateOptionGroup = (idx, field, value) => {
        const newOptions = [...(prodForm.product_options || [])];
        newOptions[idx][field] = value;
        setProdForm({ ...prodForm, product_options: newOptions });
    };

    const addChoice = (groupIdx) => {
        const newOptions = [...(prodForm.product_options || [])];
        newOptions[groupIdx].choices.push({ name: '', image: '' });
        setProdForm({ ...prodForm, product_options: newOptions });
    };

    const removeChoice = (groupIdx, choiceIdx) => {
        const newOptions = [...(prodForm.product_options || [])];
        newOptions[groupIdx].choices = newOptions[groupIdx].choices.filter((_, i) => i !== choiceIdx);
        setProdForm({ ...prodForm, product_options: newOptions });
    };

    const updateChoice = (groupIdx, choiceIdx, field, value) => {
        const newOptions = [...(prodForm.product_options || [])];
        newOptions[groupIdx].choices[choiceIdx][field] = value;
        setProdForm({ ...prodForm, product_options: newOptions });
    };

    const handleChoiceImageUpload = async (e, groupIdx, choiceIdx) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const compressedBase64 = await compressImage(file, 400, 0.6); // Smaller for choices
                updateChoice(groupIdx, choiceIdx, 'image', compressedBase64);
            } catch (error) {
                console.error("Error choice image:", error);
            }
        }
    };

    const navItemStyle = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.75rem 1rem',
        marginBottom: '0.5rem',
        borderRadius: '8px',
        border: 'none',
        background: isActive ? '#990000' : 'transparent',
        color: isActive ? 'white' : '#1e293b',
        fontWeight: isActive ? '600' : '400',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        fontSize: '0.95rem'
    });

    const renderSidebar = () => (
        <>
            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                />
            )}

            {/* Sidebar - Desktop: Static/Sticky, Mobile: Fixed Overlay */}
            <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{
                width: '280px',
                background: 'white',
                color: '#1e293b',
                display: isMobile ? (isSidebarOpen ? 'flex' : 'none') : 'flex',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                top: 0,
                bottom: 0,
                height: isMobile ? '100vh' : '100%', // Desktop: 100% of parent which is 100vh
                zIndex: 50,
                transition: isMobile ? 'transform 0.3s ease' : 'none',
                overflowY: 'auto',
                boxShadow: '4px 0 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#990000', margin: 0 }}>Chianti Admin</h2>
                    {isMobile && <button onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X size={24} /></button>}
                </div>

                <div style={{ padding: '0 1rem 1rem 1rem', borderBottom: '1px solid #f1f5f9', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                        <div style={{ padding: '8px', background: '#990000', borderRadius: '50%', color: 'white' }}>
                            <UserCog size={20} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{adminName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>{adminRole}</div>
                        </div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '0 1rem' }}>
                    {NAV_ITEMS.map((item, index) => {
                        // Header
                        if (item.header) {
                            // Check if user has access to at least one item in this section? 
                            // Simplification: Just show headers, or maybe filter out if no items visible. 
                            // For now simple render.
                            return <div key={index} style={{ padding: '1rem 0 0.5rem 0', fontSize: '0.75rem', color: '#990000', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 'bold' }}>{item.header}</div>;
                        }
                        // Nav Item
                        if (canAccess(item.permission)) {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (item.id === 'events') { navigate('/admin/events'); }
                                        else if (item.id === 'pos') { window.open('/admin/pos', '_blank'); } // Assuming POS opens in new window or route
                                        else { setActiveTab(item.id); }

                                        if (isMobile) setIsSidebarOpen(false);
                                    }}
                                    style={navItemStyle(activeTab === item.id)}
                                >
                                    {Icon && <Icon size={18} />} {item.label}
                                </button>
                            );
                        }
                        return null;
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #334155' }}>
                    <button
                        onClick={handleLogout}
                        style={{ ...navItemStyle(false), color: '#ef4444', justifyContent: 'flex-start', width: '100%' }}
                    >
                        <LogOut size={20} /> Deconectare
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="admin-dashboard-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'white' }}>
            {/* Mobile Header Toggle */}
            {isMobile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
                    background: '#990000', zIndex: 40, display: 'flex', alignItems: 'center', padding: '0 1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', display: 'flex' }}>
                        <div style={{ padding: '5px' }}><Settings size={24} /></div>
                    </button>
                    <span style={{ marginLeft: '1rem', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>Chianti Admin</span>
                </div>
            )}

            {renderSidebar()}

            <main style={{
                flex: 1,
                padding: isMobile ? '70px 1rem 1rem 1rem' : '2rem',
                overflowY: 'auto',
                height: '100%',
                width: '100%',
                background: 'white'
            }}>
                <div className="tab-content-container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
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
                    {/* INVENTORY OBJECTS TAB */}
                    {activeTab === 'inventory_objects' && (
                        <div className="tab-content">
                            <AdminInventoryObjects />
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
                    {/* PROCUREMENT TAB */}
                    {activeTab === 'procurement' && (
                        <div className="tab-content" style={{ padding: 0 }}>
                            <AdminProcurement />
                        </div>
                    )}

                    {/* CONFIGURATOR MAIN TAB */}
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
                    {/* POS TAB */}
                    {activeTab === 'pos' && (
                        <div className="tab-content" style={{ padding: 0, maxWidth: 'none' }}>
                            <AdminPOS />
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
                                                            <button className="btn-icon" onClick={() => duplicateProduct(product)} title="Duplică" style={{ color: '#2563eb' }}><Copy size={18} /></button>
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
                                    <Truck size={16} style={{ marginRight: '8px' }} /> Comenzi Rapide
                                </button>
                                <button
                                    className={`btn ${activeTabType === 'catering' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setActiveTabType('catering')}
                                    style={{ flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                                >
                                    <Users size={16} style={{ marginRight: '8px' }} /> Precomenzi
                                </button>
                            </div>

                            <div className="actions-bar">
                                <button className="btn btn-primary" onClick={() => openAddCategoryModal(null)}>
                                    <Plus size={18} /> Adaugă Categorie ({activeTabType === 'delivery' ? 'Comenzi Rapide' : 'Precomenzi'})
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
                                            {categories
                                                .filter(c => (!c.type || c.type === 'delivery') === (activeProductTabType === 'delivery'))
                                                .map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
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

                                {/* PRODUCTION GALLERY SECTION (Internal) */}
                                <div className="form-group" style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                    <label style={{ color: '#990000', fontWeight: 'bold' }}>Galerie Producție (Uz Intern)</label>
                                    <p style={{ fontSize: '0.8rem', color: '#7f1d1d', marginTop: '-5px', marginBottom: '10px' }}>
                                        Poze cu produsul final ambalat pentru angajați (nu sunt vizibile clienților).
                                    </p>
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
                                                            production_gallery: [...(prev.production_gallery || []), base64]
                                                        }));
                                                    } catch (err) {
                                                        console.error("Error uploading production gallery image", err);
                                                    }
                                                }
                                            }}
                                            style={{ width: 'auto' }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>Max 800px</span>
                                    </div>
                                    <div className="gallery-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                        {(prodForm.production_gallery || []).map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                <img
                                                    src={img}
                                                    alt={`Prod Gallery ${idx}`}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', cursor: 'zoom-in' }}
                                                    onClick={() => setPreviewImage(img)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setProdForm(prev => ({
                                                            ...prev,
                                                            production_gallery: prev.production_gallery.filter((_, i) => i !== idx)
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
                                        <label>Alergeni</label>
                                        <input type="text" className="form-control" value={prodForm.allergens || ''} onChange={e => setProdForm({ ...prodForm, allergens: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '10px' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#7f1d1d' }}>Instrucțiuni Interne (Optional)</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={prodForm.internal_instructions || ''}
                                        onChange={e => setProdForm({ ...prodForm, internal_instructions: e.target.value })}
                                        placeholder="Ex: Se ambalează în cutie mare, se pune topping separat..."
                                        style={{ fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ingrediente</label>
                                    <textarea className="form-control" rows="2" value={prodForm.ingredients || ''} onChange={e => setProdForm({ ...prodForm, ingredients: e.target.value })} placeholder="Ex: Roșii, Mozzarella, Busuioc..." />
                                </div>




                                {/* EXTRAS SECTION (Cross-sell) */}
                                <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', background: '#f0fdf4', padding: '1rem', borderRadius: '8px' }}>
                                    <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block', color: '#166534' }}>
                                        <ShoppingCart size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                        Produse Extra / Completări (Cross-sell)
                                    </label>
                                    <p style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '10px' }}>
                                        Produse care apar <strong>imediat sub produs</strong> în meniu (ex: Ardei, Pâine, Smântână).
                                    </p>
                                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Caută produs extra (ex: Ardei)..."
                                            value={extraSearchTerm}
                                            onChange={(e) => setExtraSearchTerm(e.target.value)}
                                            style={{ width: '100%', borderColor: '#bbf7d0' }}
                                        />
                                        {extraSearchTerm.length > 0 && (
                                            <div className="rec-search-results" style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                background: 'white', border: '1px solid #ddd', borderRadius: '4px',
                                                maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            }}>
                                                {products
                                                    .filter(p => !editingProduct || p.id !== editingProduct.id)
                                                    .filter(p => !currentExtras.some(r => r.id === p.id))
                                                    .filter(p => p.name.toLowerCase().includes(extraSearchTerm.toLowerCase()))
                                                    .map(p => (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => handleSelectExtra(p)}
                                                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}
                                                            onMouseEnter={(e) => e.target.style.background = '#f0fdf4'}
                                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                                        >
                                                            <span>{p.name}</span>
                                                            <span style={{ color: '#888', fontSize: '0.9em' }}>{p.price} Lei</span>
                                                        </div>
                                                    ))}
                                                {products.filter(p => p.name.toLowerCase().includes(extraSearchTerm.toLowerCase())).length === 0 && (
                                                    <div style={{ padding: '8px 12px', color: '#888' }}>Nu am găsit produse.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* List of current extras */}
                                    <div className="recommendations-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {currentExtras.map(ex => (
                                            <div key={ex.id} style={{
                                                display: 'flex', alignItems: 'center',
                                                background: 'white', padding: '5px 10px',
                                                borderRadius: '20px', fontSize: '0.9rem',
                                                border: '1px solid #bbf7d0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                            }}>
                                                <span style={{ fontWeight: '500', color: '#166534' }}>{ex.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExtra(ex.id)}
                                                    style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', marginLeft: '8px', display: 'flex', alignItems: 'center' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {currentExtras.length === 0 && <small className="text-muted" style={{ color: '#166534' }}>Niciun produs extra selectat.</small>}
                                    </div>
                                </div>

                                {/* OPTIONS / VARIANTS SECTION */}
                                <div className="form-group" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                                    <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block', color: '#92400e' }}>
                                        <Settings size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                                        Opțiuni Obligatorii (Ex: Arome, Variante)
                                    </label>
                                    <p style={{ fontSize: '0.8rem', color: '#92400e', marginBottom: '10px' }}>
                                        Adaugă grupuri de opțiuni (ex: "Alege Aromă") și variantele disponibile (ex: "Ciocolată", "Vanilie").
                                    </p>

                                    {(prodForm.product_options || []).map((group, gIdx) => (
                                        <div key={gIdx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #ddd' }}>
                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Nume Grup Opțiuni (ex: Alege Dulceață)"
                                                    value={group.name}
                                                    onChange={(e) => updateOptionGroup(gIdx, 'name', e.target.value)}
                                                    style={{ fontWeight: 'bold' }}
                                                />
                                                <button type="button" className="btn-icon delete" onClick={() => removeOptionGroup(gIdx)} title="Șterge Grup">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>

                                            {/* Choices Grid */}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                {group.choices && group.choices.map((choice, cIdx) => (
                                                    <div key={cIdx} style={{
                                                        border: '1px solid #ddd',
                                                        borderRadius: '20px',
                                                        padding: '6px 12px',
                                                        background: '#f8f9fa',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        position: 'relative' // For dropdown positioning
                                                    }}>
                                                        <input
                                                            type="text"
                                                            value={choice.name}
                                                            onChange={(e) => updateChoice(gIdx, cIdx, 'name', e.target.value)}
                                                            onFocus={() => setFocusedOption({ gIdx, cIdx })}
                                                            onBlur={() => setTimeout(() => setFocusedOption(null), 200)} // Delay to allow click
                                                            placeholder="Nume variantă"
                                                            style={{
                                                                border: 'none',
                                                                background: 'transparent',
                                                                outline: 'none',
                                                                minWidth: '80px',
                                                                fontWeight: '500',
                                                                fontSize: '0.9rem',
                                                                color: (choice.name && !products.some(p => p.name.toLowerCase() === choice.name.toLowerCase())) ? '#ef4444' : 'inherit'
                                                            }}
                                                        />

                                                        {/* Autocomplete Dropdown */}
                                                        {focusedOption && focusedOption.gIdx === gIdx && focusedOption.cIdx === cIdx && choice.name.length > 0 && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '100%',
                                                                left: 0,
                                                                background: 'white',
                                                                border: '1px solid #ddd',
                                                                borderRadius: '4px',
                                                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                                zIndex: 10,
                                                                maxHeight: '150px',
                                                                overflowY: 'auto',
                                                                minWidth: '150px'
                                                            }}>
                                                                {products
                                                                    .filter(p => p.name.toLowerCase().includes(choice.name.toLowerCase()))
                                                                    .slice(0, 5) // Limit suggestions
                                                                    .map(p => (
                                                                        <div
                                                                            key={p.id}
                                                                            onClick={() => updateChoice(gIdx, cIdx, 'name', p.name)}
                                                                            style={{
                                                                                padding: '5px 10px',
                                                                                fontSize: '0.85rem',
                                                                                cursor: 'pointer',
                                                                                borderBottom: '1px solid #f0f0f0'
                                                                            }}
                                                                            onMouseEnter={(e) => e.target.style.background = '#f0f9ff'}
                                                                            onMouseLeave={(e) => e.target.style.background = 'white'}
                                                                        >
                                                                            {p.name}
                                                                        </div>
                                                                    ))
                                                                }
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeChoice(gIdx, cIdx)}
                                                            style={{
                                                                background: '#fee2e2', color: '#ef4444',
                                                                border: 'none', borderRadius: '50%',
                                                                width: '20px', height: '20px',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', fontSize: '14px', lineHeight: 1
                                                            }}
                                                            title="Șterge"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => addChoice(gIdx)}
                                                    style={{
                                                        border: '1px dashed #aaa',
                                                        borderRadius: '20px',
                                                        padding: '6px 12px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                        color: '#666', fontSize: '0.9rem'
                                                    }}
                                                >
                                                    <Plus size={16} /> Adaugă Variantă
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={addOptionGroup}>
                                        <Plus size={16} /> Adaugă Grup Nou
                                    </button>
                                </div>

                                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <button type="button" className="btn" onClick={() => setIsProductModalOpen(false)} style={{ background: '#dc2626', color: 'white', border: 'none' }}>
                                        Anulează
                                    </button>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#16a34a', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', padding: '12px' }}>
                                        {editingProduct ? 'Salvează Modificările' : 'Adaugă Produs'}
                                    </button>
                                </div>
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
            </main>
        </div>
    );
};

export default AdminDashboard;
