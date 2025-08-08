// src/App.jsx

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Lucide-React icons for a clean, modern look.
import { Home, Notebook, Trash, Edit, Plus, UserCircle, X, Book, Utensils, ClipboardList } from 'lucide-react';

// Data for services to easily manage and display them.
const serviceData = {
    'meal-plans': {
        title: "Personalized Meal Plans",
        description: "Are you tired of bland, boring meals? I believe that healthy eating should be delicious and exciting! My personalized meal plans are designed to fit your unique dietary needs, health goals, and lifestyle. I'll work with you to create a customized plan that ensures you're getting all the right nutrients while enjoying every bite. Let's make healthy eating a joy, not a chore! 🥗",
        icon: <Utensils className="w-8 h-8 text-emerald-700" />,
        image: "https://placehold.co/600x400/e5e7eb/4b5563?text=Personalized+Meal+Plan"
    },
    'counseling': {
        title: "Nutritional Counseling",
        description: "Navigating the world of nutrition can be overwhelming. As your registered dietitian, I'm here to provide you with evidence-based guidance and unwavering support. In our one-on-one sessions, we'll discuss your health concerns, set realistic goals, and create a roadmap to a healthier you. Whether you're looking to manage a specific condition or simply improve your overall well-being, I'll be your partner every step of the way. 🗣️",
        icon: <Book className="w-8 h-8 text-emerald-700" />,
        image: "https://placehold.co/600x400/d1d5db/333333?text=Nutritional+Counseling"
    },
    'paediatric-nutrition': {
        title: "Paediatric Nutrition",
        description: "Feeding your little one is one of the most important jobs you have as a parent. From picky eaters to food allergies, I provide expert guidance on childhood nutrition to ensure your children get the right nutrients to grow, thrive, and reach their full potential. My goal is to empower you with the knowledge and tools to foster a positive relationship with food for your entire family. 👶🍏",
        icon: <ClipboardList className="w-8 h-8 text-emerald-700" />,
        image: "https://placehold.co/600x400/a0aec0/ffffff?text=Paediatric+Nutrition"
    }
};

// --- Main App Component ---
function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [currentService, setCurrentService] = useState(null); // New state for the current service page
    const [posts, setPosts] = useState([]);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // TODO: REPLACE THIS WITH YOUR OWN FIREBASE CONFIG
    // You can get this from your Firebase project settings
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);

    // 1. Initialize Firebase and listen for auth state changes
    useEffect(() => {
        const setupFirebase = async () => {
            try {
                // Initialize Firebase app and services
                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                setDb(firestoreDb);
                setAuth(firebaseAuth);

                // Sign in anonymously to enable read/write access based on your security rules
                await signInAnonymously(firebaseAuth);

                // Listen for authentication state changes
                const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
                    setUser(currentUser);
                    setIsAuthReady(true);
                });

                // Clean up the listener on component unmount
                return () => unsubscribe();
            } catch (error) {
                console.error("Firebase initialization or authentication failed:", error);
                setIsAuthReady(true); // Ensure app can still run even if auth fails
            }
        };

        setupFirebase();
    }, []);

    // 2. Fetch blog posts in real-time after authentication is ready
    useEffect(() => {
        if (!isAuthReady || !db) return;

        setLoadingPosts(true);
        // The collection path for public data, using the project ID as the root
        // NOTE: Your security rules will need to be configured for this path.
        const collectionPath = `blog-posts`;
        const postsCollection = collection(db, collectionPath);
        const q = query(postsCollection);

        // onSnapshot listens for real-time changes
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort posts by creation date, newest first
            fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
            setPosts(fetchedPosts);
            setLoadingPosts(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setLoadingPosts(false);
        });

        // Clean up the listener when the component unmounts
        return () => unsubscribe();
    }, [isAuthReady, db]);

    // Function to handle navigating to a service page
    const handleServiceClick = (serviceId) => {
        setCurrentPage('service');
        setCurrentService(serviceId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'blog':
                return <BlogPage posts={posts} loading={loadingPosts} />;
            case 'admin':
                // Pass db, user, posts, loading to AdminPanel
                return <AdminPanel db={db} user={user} posts={posts} loading={loadingPosts} />;
            case 'service':
                // Check if the service exists before rendering
                const service = serviceData[currentService];
                if (service) {
                    return <ServicePage {...service} />;
                }
                // Fallback if the service ID is invalid
                return <NotFoundPage />;
            case 'home':
            default:
                // Pass the new click handler to the HomePage
                return <HomePage onServiceClick={handleServiceClick} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-inter">
            <Header setCurrentPage={setCurrentPage} currentPage={currentPage} user={user} />
            <main className="flex-grow">
                {renderPage()}
            </main>
            <Footer />
        </div>
    );
}

// --- Component for the Navigation Header ---
function Header({ setCurrentPage, currentPage, user }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const userId = user?.uid || 'guest';

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
                <a href="#" className="text-2xl font-bold text-emerald-600">LiveWell by Louisa 🌱</a>
                
                {/* User ID Display */}
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                    <UserCircle className="w-5 h-5 text-gray-400" />
                    <span>{userId}</span>
                </div>

                {/* Mobile Menu Button */}
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)} 
                    className="md:hidden p-2 text-emerald-600 focus:outline-none"
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                </button>

                {/* Desktop Navigation Links */}
                <div className="hidden md:flex space-x-6 font-medium text-lg">
                    <button onClick={() => setCurrentPage('home')} className={`transition-colors duration-300 ${currentPage === 'home' ? 'text-emerald-700 font-bold' : 'text-gray-600 hover:text-emerald-700'}`}>
                        Home
                    </button>
                    <button onClick={() => setCurrentPage('blog')} className={`transition-colors duration-300 ${currentPage === 'blog' ? 'text-emerald-700 font-bold' : 'text-gray-600 hover:text-emerald-700'}`}>
                        Blog ✍️
                    </button>
                    <button onClick={() => setCurrentPage('admin')} className={`transition-colors duration-300 ${currentPage === 'admin' ? 'text-emerald-700 font-bold' : 'text-gray-600 hover:text-emerald-700'}`}>
                        Admin Panel ⚙️
                    </button>
                </div>
            </nav>

            {/* Mobile Navigation Menu */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-white bg-opacity-95 p-6 flex flex-col items-center justify-center">
                    <button 
                        onClick={() => setIsMenuOpen(false)} 
                        className="absolute top-4 right-4 p-2 text-emerald-600 focus:outline-none"
                        aria-label="Close menu"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <nav className="flex flex-col space-y-6 pt-16 text-center font-bold text-2xl">
                        <button onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }} className="text-gray-800 hover:text-emerald-700 transition-colors duration-300">Home</button>
                        <button onClick={() => { setCurrentPage('blog'); setIsMenuOpen(false); }} className="text-gray-800 hover:text-emerald-700 transition-colors duration-300">Blog ✍️</button>
                        <button onClick={() => { setCurrentPage('admin'); setIsMenuOpen(false); }} className="text-gray-800 hover:text-emerald-700 transition-colors duration-300">Admin Panel ⚙️</button>
                    </nav>
                     {/* User ID Display in Mobile Menu */}
                    <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <UserCircle className="w-5 h-5 text-gray-400" />
                        <span>{userId}</span>
                    </div>
                </div>
            )}
        </header>
    );
}

// --- Home Page Component ---
function HomePage({ onServiceClick }) {
    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 text-center">
                <div className="flex flex-col items-center">
                    <img src="https://placehold.co/150x150/d1d5db/333333?text=Louisa" alt="Louisa's profile" className="rounded-full w-40 h-40 mb-6 object-cover shadow-lg transform transition-transform duration-300 hover:scale-110" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-2">LiveWell by Louisa 💚</h1>
                    <p className="text-xl md:text-2xl font-medium text-emerald-600 mb-4">Ghanaian Registered Dietitian & Wellness Advocate</p>
                    <p className="text-md md:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                        Hello! 👋 I'm Louisa, your partner in achieving optimal health through evidence-based nutrition. I'm passionate about helping families, especially children, build a foundation for a healthy, happy life. Let's start this journey together! 💪
                    </p>
                    <a onClick={() => onServiceClick('counseling')} className="bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-500 transition-transform transform hover:scale-105 duration-300 cursor-pointer">
                        Book a Consultation 📅
                    </a>
                </div>
            </div>

            <div id="about" className="bg-white py-16 md:py-24 border-t border-gray-200 mt-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">About Me</h2>
                    <div className="flex flex-col md:flex-row items-center md:space-x-12">
                        <div className="md:w-1/2 mb-8 md:mb-0">
                            <img src="https://placehold.co/600x400/e5e7eb/4b5563?text=Louisa+and+a+client" alt="Louisa working with a client" className="rounded-lg shadow-xl w-full h-auto object-cover transform transition-transform duration-300 hover:scale-105" />
                        </div>
                        <div className="md:w-1/2">
                            <p className="text-lg text-gray-700 leading-relaxed mb-4">
                                My journey began with a deep passion for understanding how food impacts our bodies and our lives. I believe that good nutrition is the cornerstone of a vibrant, healthy community.
                            </p>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                My specialization and true passion lies in <span className="font-semibold text-emerald-600">paediatric nutrition</span> 🍏. I am dedicated to helping parents navigate the complexities of feeding their children, ensuring they get the right nutrients to grow, thrive, and reach their full potential.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="services" className="py-16 md:py-24">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">My Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Now passing the onServiceClick handler and a unique ID */}
                        <ServiceCard
                            onClick={() => onServiceClick('meal-plans')}
                            icon={<Utensils className="w-8 h-8 text-emerald-700" />}
                            title="Personalized Meal Plans"
                            description="Customized meal plans tailored to your specific health goals, dietary needs, and lifestyle, ensuring you enjoy delicious food while staying on track. 🍽️"
                        />
                        <ServiceCard
                            onClick={() => onServiceClick('counseling')}
                            icon={<Book className="w-8 h-8 text-emerald-700" />}
                            title="Nutritional Counseling"
                            description="One-on-one sessions to discuss your health concerns, educate you on nutrition principles, and set realistic, achievable goals for a healthier you. 🗣️"
                        />
                        <ServiceCard
                            onClick={() => onServiceClick('paediatric-nutrition')}
                            icon={<ClipboardList className="w-8 h-8 text-emerald-700" />}
                            title="Paediatric Nutrition"
                            description="Expert guidance on childhood nutrition, addressing picky eating, food allergies, and fostering healthy eating habits for your children's development. 🧑‍🍼"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Reusable Service Card Component ---
function ServiceCard({ icon, title, description, onClick }) {
    return (
        <div onClick={onClick} className="bg-white rounded-xl shadow-lg p-8 transform transition-transform duration-300 hover:scale-105 cursor-pointer">
            <div className="flex items-center justify-center bg-emerald-100 rounded-full w-16 h-16 mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

// --- Blog Page Component ---
function BlogPage({ posts, loading }) {
    return (
        <section className="container mx-auto px-4 py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">LiveWell Blog ✍️</h2>
            <p className="text-center text-lg text-gray-600 mb-8">
                Explore a collection of articles on nutrition, health tips, and wellness.
            </p>
            {loading ? (
                <p className="text-center text-gray-500">Loading blog posts...</p>
            ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map(post => (
                        <BlogPostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">No blog posts to display yet. Check back soon! 🙏</p>
            )}
        </section>
    );
}

// --- Reusable Blog Post Card Component ---
function BlogPostCard({ post }) {
    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105">
            <img src={post.imageUrl || "https://placehold.co/600x350/a0aec0/ffffff?text=Blog+Image"} alt={post.title} className="w-full h-48 object-cover" />
            <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{new Date(post.createdAt).toLocaleDateString()}</p>
                <p className="text-gray-600">{post.content.substring(0, 150)}...</p>
            </div>
        </div>
    );
}

// --- Dedicated Service Page Component ---
function ServicePage({ title, description, image }) {
    const [formData, setFormData] = useState({ name: '', email: '', message: '', service: title });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setMessage('Thank you for reaching out! Your message has been sent. We will get back to you shortly. 🙏');
        // In a real application, you would send this data to a backend here.
        // For now, we'll just log it.
        console.log("Service Inquiry Submitted:", formData);
        setFormData({ name: '', email: '', message: '', service: title }); // Reset form
    };

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row md:space-x-12 items-center">
                    <div className="md:w-1/2 mb-8 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{title}</h1>
                        <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">{description}</p>
                        <img src={image} alt={title} className="rounded-lg shadow-xl w-full h-auto object-cover transform transition-transform duration-300 hover:scale-105" />
                    </div>
                    <div className="md:w-1/2">
                         <div className="bg-gray-100 p-8 md:p-12 rounded-xl shadow-lg">
                            <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">Inquire about this service</h2>
                            {message && (
                                <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 text-center">
                                    {message}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-lg font-medium text-gray-700">Name</label>
                                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" required />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-lg font-medium text-gray-700">Email</label>
                                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" required />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-lg font-medium text-gray-700">Message</label>
                                    <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows="4" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" required></textarea>
                                </div>
                                <input type="hidden" name="service" value={formData.service} />
                                <div className="text-center">
                                    <button type="submit" className="bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-500 transition-transform transform hover:scale-105 duration-300">
                                        Send Inquiry 🚀
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// --- Generic "Not Found" Page Component ---
function NotFoundPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center px-4">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-xl text-gray-600 mb-8">Oops! We couldn't find that page. 🤷‍♂️</p>
            <a href="#" className="bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-500 transition-transform transform hover:scale-105 duration-300">
                Return Home
            </a>
        </div>
    );
}

// --- Admin Panel Component ---
function AdminPanel({ db, user, posts, loading }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [editingPostId, setEditingPostId] = useState(null);
    const [message, setMessage] = useState('');
    const [showForm, setShowForm] = useState(false);

    // Form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!user || !user.uid) {
            setMessage('You must be authenticated to perform this action.');
            return;
        }

        const newPost = {
            title,
            content,
            imageUrl,
            createdAt: Date.now()
        };

        try {
            if (editingPostId) {
                // Update an existing post
                const docRef = doc(db, `blog-posts`, editingPostId);
                await updateDoc(docRef, newPost);
                setMessage('Post updated successfully! ✨');
            } else {
                // Add a new post
                const collectionRef = collection(db, `blog-posts`);
                await addDoc(collectionRef, newPost);
                setMessage('New post added successfully! 🎉');
            }
            // Clear the form
            setTitle('');
            setContent('');
            setImageUrl('');
            setEditingPostId(null);
            setShowForm(false);
        } catch (error) {
            console.error("Error writing document: ", error);
            setMessage('Error: Could not save post. Please try again.');
        }
    };

    const handleEditClick = (post) => {
        setTitle(post.title);
        setContent(post.content);
        setImageUrl(post.imageUrl);
        setEditingPostId(post.id);
        setShowForm(true);
    };

    const handleDeleteClick = async (postId) => {
        if (!user || !user.uid) {
            setMessage('You must be authenticated to perform this action.');
            return;
        }
        
        // Custom confirmation modal instead of window.confirm
        const isConfirmed = window.confirm("Are you sure you want to delete this post?");
        if (isConfirmed) {
            try {
                const docRef = doc(db, `blog-posts`, postId);
                await deleteDoc(docRef);
                setMessage('Post deleted successfully! 🗑️');
            } catch (error) {
                console.error("Error deleting document: ", error);
                setMessage('Error: Could not delete post.');
            }
        }
    };
    
    // Check if the user is authenticated. In a real app, you'd have proper user roles.
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-16 md:py-24 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Admin Panel Access Denied 🔒</h2>
                <p className="text-gray-600 text-lg">
                    You must be a logged-in user to view this panel.
                </p>
                <p className="text-gray-600 mt-4">
                    On a local environment, you would need to set up proper authentication (e.g., email/password) to manage posts.
                </p>
            </div>
        );
    }

    return (
        <section className="container mx-auto px-4 py-16 md:py-24">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">Admin Panel ⚙️</h2>

            {message && (
                <div className="bg-emerald-100 text-emerald-800 p-4 rounded-lg mb-6 text-center">
                    {message}
                </div>
            )}
            
            <div className="flex justify-end mb-6">
                <button 
                    onClick={() => { setShowForm(!showForm); setEditingPostId(null); setTitle(''); setContent(''); setImageUrl(''); }} 
                    className="bg-emerald-600 text-white font-semibold py-2 px-6 rounded-full shadow-md hover:bg-emerald-500 transition-colors duration-300 flex items-center space-x-2"
                >
                    {editingPostId ? 'Cancel Edit' : 'Add New Post'} <Plus className="w-5 h-5" />
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-8 md:p-12 rounded-xl shadow-lg mb-12">
                    <h3 className="text-2xl font-bold mb-6">{editingPostId ? 'Edit Post' : 'Create New Post'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="title" className="block text-lg font-medium text-gray-700">Title</label>
                            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" required />
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-lg font-medium text-gray-700">Image URL</label>
                            <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" placeholder="https://placehold.co/600x350/a0aec0/ffffff?text=Blog+Image" />
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-lg font-medium text-gray-700">Content</label>
                            <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows="6" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3" required></textarea>
                        </div>
                        <div className="text-center">
                            <button type="submit" className="bg-emerald-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-500 transition-transform transform hover:scale-105 duration-300">
                                {editingPostId ? 'Update Post' : 'Publish Post'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <h3 className="text-2xl font-bold mb-6">Existing Posts</h3>
            {loading ? (
                <p className="text-center text-gray-500">Loading posts...</p>
            ) : posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white p-6 rounded-lg shadow flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-semibold">{post.title}</h4>
                                <p className="text-sm text-gray-500">ID: {post.id}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEditClick(post)} className="p-2 text-blue-500 hover:text-blue-700 rounded-full transition-colors duration-200" aria-label="Edit Post">
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteClick(post.id)} className="p-2 text-red-500 hover:text-red-700 rounded-full transition-colors duration-200" aria-label="Delete Post">
                                    <Trash className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">No posts found.</p>
            )}
        </section>
    );
}

// --- Footer Component ---
function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-8">
            <div className="container mx-auto px-4 text-center">
                <div className="flex justify-center space-x-6 mb-4">
                    {/* Placeholder for social media icon links */}
                    <a href="https://www.instagram.com/loui_sahhhh" className="text-gray-400 hover:text-white transition-colors duration-300" target="_blank" rel="noopener noreferrer">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c2.71 0 3.05.01 4.12.06 1.07.05 1.77.22 2.41.47.64.25 1.18.6 1.72 1.14.54.54.89 1.08 1.14 1.72.25.64.42 1.34.47 2.41.05 1.07.06 1.41.06 4.12s-.01 3.05-.06 4.12c-.05 1.07-.22 1.77-.47 2.41-.25.64-.6 1.18-1.14 1.72-.54.54-1.08.89-1.72 1.14-.64.25-1.34.42-2.41.47-1.07.05-1.41.06-4.12.06s-3.05-.01-4.12-.06c-1.07-.05-1.77-.22-2.41-.47-.64-.25-1.18-.6-1.72-1.14-.54-.54-.89-1.08-1.14-1.72-.25-.64-.42-1.34-.47-2.41-.05-1.07-.06-1.41-.06-4.12s.01-3.05.06-4.12c.05-1.07.22-1.77.47-2.41.25-.64.6-1.18 1.14-1.72.54-.54 1.08-.89 1.72-1.14.64-.25 1.34-.42 2.41-.47C8.95 2.01 9.29 2 12 2zm0-2C8.83 0 8.44.01 7.2.06 6.07.12 5.25.32 4.49.63 3.73.94 3.07 1.44 2.4 2.11 1.74 2.77 1.24 3.43.93 4.19.62 4.95.42 5.77.36 6.9.31 8.17.3 8.56.3 12c0 3.17.01 3.56.06 4.8.05 1.13.25 1.95.56 2.71.31.76.81 1.42 1.47 2.09.66.66 1.32 1.16 2.08 1.47.76.31 1.58.51 2.71.56 1.23.05 1.62.06 4.8.06s3.56-.01 4.8-.06c1.13-.05 1.95-.25 2.71-.56.76-.31 1.42-.81 2.09-1.47.66-.66 1.16-1.32 1.47-2.08.31-.76.51-1.58.56-2.71.05-1.23.06-1.62.06-4.8s-.01-3.56-.06-4.8c-.05-1.13-.25-1.95-.56-2.71-.31-.76-.81-1.42-1.47-2.09-.66-.66-1.32-1.16-2.08-1.47-.76-.31-1.58-.51-2.71-.56-1.23-.05-1.62-.06-4.8-.06zm0 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 10.2a4 4 0 110-8 4 4 0 010 8z"></path></svg>
                    </a>
                </div>
                <p>&copy; 2023 LiveWell by Louisa. All rights reserved. 🌿</p>
            </div>
        </footer>
    );
}

export default App;
```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom font import for Inter, to match Tailwind's default setup */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
  },
  plugins: [],
}
