import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Sparkles, 
  MessageSquare, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Mic,
  Box,
  ChevronRight,
  Gift,
  Heart,
  Star
} from 'lucide-react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, addDoc, doc, setDoc, getDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Product, CartItem, UserProfile } from './types';
import { getGiftRecommendations, chatWithAssistant } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ cartCount, onOpenCart, user, onSignIn, onSignOut }: any) => (
  <nav className="fixed top-0 left-0 right-0 z-50 glass px-8 py-5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-ink rounded-full flex items-center justify-center">
        <Gift className="text-paper w-5 h-5" />
      </div>
      <span className="text-lg font-bold tracking-tighter uppercase">Gifty.AI</span>
    </div>

    <div className="hidden md:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-ink/60">
      <a href="#" className="hover:text-ink transition-colors">Collection</a>
      <a href="#" className="hover:text-ink transition-colors">AI Wizard</a>
      <a href="#" className="hover:text-ink transition-colors">Journal</a>
      <a href="#" className="hover:text-ink transition-colors">Concierge</a>
    </div>

    <div className="flex items-center gap-6">
      <button className="p-2 hover:bg-ink/5 rounded-full transition-colors">
        <Search className="w-5 h-5" />
      </button>
      <button 
        onClick={onOpenCart}
        className="group relative flex items-center gap-2"
      >
        <div className="p-2 group-hover:bg-ink/5 rounded-full transition-colors">
          <ShoppingBag className="w-5 h-5" />
        </div>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
            {cartCount}
          </span>
        )}
      </button>
      {user ? (
        <div className="flex items-center gap-4 pl-4 border-l border-ink/10">
          <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full grayscale hover:grayscale-0 transition-all duration-500" />
          <button onClick={onSignOut} className="text-[10px] font-bold uppercase tracking-widest hover:text-accent transition-colors">Exit</button>
        </div>
      ) : (
        <button 
          onClick={onSignIn}
          className="bg-ink text-paper px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:scale-105 transition-all"
        >
          Join
        </button>
      )}
    </div>
  </nav>
);

const Hero = ({ onOpenRecommender }: any) => (
  <section className="relative min-h-screen flex flex-col justify-center px-8 overflow-hidden">
    <div className="absolute top-0 right-0 w-1/2 h-full bg-neutral-200/50 -z-10 mask-fade-bottom">
      <img 
        src="https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=2070&auto=format&fit=crop" 
        className="w-full h-full object-cover grayscale opacity-40 mix-blend-multiply"
        alt="Hero Background"
      />
    </div>

    <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-20 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="h-[1px] w-12 bg-ink" />
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/40">The Future of Gifting</span>
        </div>
        
        <h1 className="text-[120px] leading-[0.85] font-bold tracking-tighter mb-10">
          Gifts <br />
          <span className="text-display text-ink/30">Redefined.</span>
        </h1>
        
        <p className="text-xl text-ink/60 max-w-md leading-relaxed mb-12 font-light">
          Experience a new era of personal gifting. Curated by intelligence, visualized in augmented reality, delivered with soul.
        </p>

        <div className="flex items-center gap-8">
          <button 
            onClick={onOpenRecommender}
            className="group relative bg-ink text-paper px-10 py-5 rounded-full font-bold overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Start AI Wizard <Sparkles className="w-5 h-5" />
            </span>
            <motion.div 
              className="absolute inset-0 bg-accent"
              initial={{ x: "-100%" }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            />
          </button>
          
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-1">Scroll to</span>
            <span className="text-sm font-bold">Explore Collection</span>
          </div>
        </div>
      </motion.div>

      <div className="relative hidden lg:block">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 aspect-[3/4] w-[400px] mx-auto rounded-[60px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)]"
        >
          <img 
            src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=2040&auto=format&fit=crop" 
            className="w-full h-full object-cover"
            alt="Featured Gift"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-paper">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2 block">Featured Item</span>
            <h3 className="text-3xl font-serif italic mb-4">The Nebula Lamp</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-paper/30 flex items-center justify-center">
                <Box className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest">AR Ready</span>
            </div>
          </div>
        </motion.div>
        
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 border border-ink/5 rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/5 rounded-full blur-[100px]" />
      </div>
    </div>
  </section>
);

const ProductCard = ({ product, onAddToCart, onOpenAR }: any) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group"
  >
    <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden bg-white border border-ink/5 mb-6">
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      
      <div className="absolute inset-0 bg-ink/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="absolute top-6 right-6 flex flex-col gap-2 translate-x-10 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
        <button className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white transition-colors">
          <Heart className="w-5 h-5" />
        </button>
        {product.arModelUrl && (
          <button 
            onClick={() => onOpenAR(product)}
            className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <Box className="w-5 h-5" />
          </button>
        )}
      </div>

      <button 
        onClick={() => onAddToCart(product)}
        className="absolute bottom-6 left-6 right-6 bg-paper text-ink py-4 rounded-3xl font-bold text-sm translate-y-20 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 hover:bg-ink hover:text-paper"
      >
        Add to Bag — ₹{product.price}
      </button>
    </div>

    <div className="px-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">{product.category}</span>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 fill-ink text-ink" />
          <span className="text-[10px] font-bold">4.9</span>
        </div>
      </div>
      <h3 className="text-xl font-bold tracking-tight mb-1">{product.name}</h3>
      <p className="text-sm text-ink/40 font-light line-clamp-1">{product.description}</p>
    </div>
  </motion.div>
);

const AIChatbot = ({ user }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const response = await chatWithAssistant(userMsg, []);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-10 right-10 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-24 right-0 w-[400px] h-[600px] bg-white rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] border border-ink/5 flex flex-col overflow-hidden"
          >
            <div className="p-8 bg-ink text-paper flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Concierge AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Ready to assist</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-paper/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-paper/30">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-8 h-8 text-ink/20" />
                  </div>
                  <h4 className="text-lg font-serif italic mb-2">Welcome to Gifty</h4>
                  <p className="text-xs text-ink/40 font-medium max-w-[200px] mx-auto">I can help you find products, track orders, or just chat about gifts.</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-5 rounded-[24px] text-sm leading-relaxed",
                    msg.role === 'user' ? "bg-ink text-paper rounded-tr-none" : "bg-white border border-ink/5 rounded-tl-none shadow-sm"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-ink/5 p-5 rounded-[24px] rounded-tl-none shadow-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-ink/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-ink/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="w-full bg-paper border-none rounded-[24px] py-4 pl-6 pr-14 text-sm focus:ring-2 focus:ring-ink transition-all"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-ink text-paper rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-20 h-20 bg-ink text-paper rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isRecommenderOpen, setIsRecommenderOpen] = useState(false);
  const [arProduct, setArProduct] = useState<Product | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          // Sync user profile to Firestore
          const userRef = doc(db, 'users', u.uid);
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            role: u.email === 'nitiniszod10@gmail.com' ? 'admin' : 'user',
            createdAt: serverTimestamp()
          }, { merge: true });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${u.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(p);
      
      // Only seed if user is admin and products are empty
      if (p.length === 0 && user?.email === 'nitiniszod10@gmail.com') {
        const seedData = [
          { name: "Crystal Galaxy Lamp", price: 2499, category: "Home Decor", image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=1974&auto=format&fit=crop", description: "A stunning 3D laser-engraved galaxy inside a crystal ball with LED base.", tags: ["tech", "decor"], stock: 50, arModelUrl: "lamp" },
          { name: "Personalized Leather Journal", price: 1299, category: "Stationery", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1974&auto=format&fit=crop", description: "Handcrafted genuine leather journal with custom initials engraving.", tags: ["personal", "classic"], stock: 30 },
          { name: "Smart Bonsai Tree", price: 4999, category: "Tech", image: "https://images.unsplash.com/photo-1512428813824-f713c24484fe?q=80&w=1974&auto=format&fit=crop", description: "A minimalist speaker and wireless charger disguised as a bonsai tree.", tags: ["tech", "nature"], stock: 15, arModelUrl: "bonsai" },
          { name: "Vintage Film Camera", price: 8999, category: "Photography", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=2076&auto=format&fit=crop", description: "Restored 35mm film camera for capturing timeless memories.", tags: ["retro", "hobby"], stock: 5 },
          { name: "Aromatherapy Diffuser", price: 1899, category: "Wellness", image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=1974&auto=format&fit=crop", description: "Ultrasonic essential oil diffuser with ambient mood lighting.", tags: ["health", "calm"], stock: 40 },
          { name: "Handmade Ceramic Set", price: 3499, category: "Kitchen", image: "https://images.unsplash.com/photo-1578749553371-872cbe7b9744?q=80&w=2070&auto=format&fit=crop", description: "Set of 4 artisan-crafted ceramic mugs with unique glaze patterns.", tags: ["artisan", "home"], stock: 20 }
        ];
        seedData.forEach(async (item) => {
          try {
            await addDoc(collection(db, 'products'), item);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'products');
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });
    return () => unsubscribe();
  }, [user]);

  const handleSignIn = () => signInWithPopup(auth, googleProvider);
  const handleSignOut = () => signOut(auth);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (!user) {
      handleSignIn();
      return;
    }

    const options = {
      key: "YOUR_RAZORPAY_KEY_ID", // This should be in .env
      amount: totalAmount * 100, // in paise
      currency: "INR",
      name: "GiftyAI",
      description: "Gift Purchase",
      handler: async function (response: any) {
        try {
          // Handle successful payment
          const orderRef = collection(db, 'orders');
          await addDoc(orderRef, {
            userId: user.uid,
            items: cart.map(i => ({ productId: i.id, quantity: i.quantity, name: i.name, price: i.price })),
            totalAmount,
            status: 'paid',
            paymentId: response.razorpay_payment_id,
            createdAt: serverTimestamp()
          });
          setCart([]);
          setIsCartOpen(false);
          alert("Payment Successful! Order ID: " + response.razorpay_payment_id);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'orders');
        }
      },
      prefill: {
        name: user.displayName,
        email: user.email,
      },
      theme: {
        color: "#000000",
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      <Navbar 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <main>
        <Hero onOpenRecommender={() => setIsRecommenderOpen(true)} />

        <section className="px-8 py-32 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-[1px] w-8 bg-ink" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-ink/40">The Selection</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tighter mb-4">Curated <span className="text-display">Collection.</span></h2>
              <p className="text-ink/40 font-light max-w-md">Handpicked artifacts designed to inspire and delight. Each piece tells a unique story.</p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
              {['All', 'Tech', 'Home Decor', 'Wellness'].map(cat => (
                <button key={cat} className="px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-ink/5 hover:bg-ink hover:text-paper transition-all whitespace-nowrap">
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={addToCart}
                onOpenAR={setArProduct}
              />
            ))}
          </div>
        </section>

        {/* AI Recommendation Section */}
        <section className="bg-ink py-32 px-8 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/20 blur-[150px] rounded-full" />
              
              <div className="relative z-10 bg-white/5 backdrop-blur-3xl p-10 rounded-[60px] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-6 mb-12">
                  <div className="w-16 h-16 bg-accent rounded-[24px] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <Sparkles className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-paper tracking-tight">Gift Wizard</h3>
                    <p className="text-paper/40 text-[10px] font-bold uppercase tracking-widest">AI-Powered Synthesis</p>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper/30">Recipient Profile</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Partner', 'Parent', 'Friend', 'Colleague'].map(p => (
                        <button key={p} className="py-4 rounded-2xl border border-white/5 text-[11px] font-bold uppercase tracking-widest text-paper/60 hover:bg-white hover:text-ink transition-all">{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper/30">Occasion Context</label>
                    <select className="w-full bg-white/5 border-none rounded-2xl py-5 px-6 text-sm font-bold text-paper focus:ring-2 focus:ring-accent transition-all">
                      <option className="bg-ink">Birthday Celebration</option>
                      <option className="bg-ink">Anniversary Milestone</option>
                      <option className="bg-ink">Housewarming Event</option>
                      <option className="bg-ink">Professional Success</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => setIsRecommenderOpen(true)}
                    className="w-full bg-paper text-ink py-6 rounded-[32px] font-bold text-lg flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform active:scale-95"
                  >
                    Synthesize Recommendations <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-[1px] w-8 bg-paper/30" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-paper/40">Intelligent Gifting</span>
              </div>
              <h2 className="text-6xl font-bold leading-[0.9] text-paper tracking-tighter mb-10">
                Decision <br />
                <span className="text-display text-paper/30">Simplified.</span>
              </h2>
              <p className="text-xl text-paper/60 mb-12 leading-relaxed font-light">
                Our neural engine synthesizes thousands of creative possibilities to find the one gift that resonates perfectly with their soul.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { icon: Heart, title: "Empathy Driven", desc: "Understands the emotional context." },
                  { icon: Box, title: "AR Synthesis", desc: "Visualize gifts in real-time." }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-paper" />
                    </div>
                    <div>
                      <h4 className="font-bold text-paper text-sm uppercase tracking-widest mb-1">{item.title}</h4>
                      <p className="text-xs text-paper/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <AIChatbot user={user} />

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-ink/60 backdrop-blur-md z-[70]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-paper z-[80] shadow-2xl flex flex-col"
            >
              <div className="p-10 border-b border-ink/5 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tighter">Your Bag</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mt-1">Review your selection</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-ink/5 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {cart.length === 0 ? (
                  <div className="text-center py-24">
                    <div className="w-24 h-24 bg-ink/5 rounded-full flex items-center justify-center mx-auto mb-8">
                      <ShoppingBag className="w-10 h-10 text-ink/10" />
                    </div>
                    <p className="text-ink/40 font-light">Your bag is currently empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-6 group">
                      <div className="w-28 h-32 bg-white rounded-[24px] overflow-hidden flex-shrink-0 border border-ink/5">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-base tracking-tight">{item.name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="text-ink/20 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-xs font-mono text-ink/40 tracking-tighter">₹{item.price}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full border border-ink/5">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-ink/40 hover:text-ink">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-ink/40 hover:text-ink">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-bold">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-10 bg-white border-t border-ink/5 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-ink/30">
                      <span>Subtotal</span>
                      <span>₹{totalAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-ink/30">
                      <span>Delivery</span>
                      <span className="text-accent">Complimentary</span>
                    </div>
                    <div className="h-[1px] w-full bg-ink/5 my-4" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold tracking-tighter">₹{totalAmount}</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-ink text-paper py-6 rounded-[32px] font-bold text-lg hover:scale-[1.02] transition-transform active:scale-95 shadow-xl"
                  >
                    Complete Purchase
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Recommender Modal */}
      <AnimatePresence>
        {isRecommenderOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRecommenderOpen(false)}
              className="absolute inset-0 bg-ink/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl bg-paper rounded-[60px] overflow-hidden shadow-2xl border border-white/10"
            >
              <RecommenderContent onClose={() => setIsRecommenderOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AR Preview Modal */}
      <AnimatePresence>
        {arProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setArProduct(null)}
              className="absolute inset-0 bg-ink/95 backdrop-blur-2xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-full max-w-5xl aspect-video bg-neutral-900 rounded-[60px] overflow-hidden border border-white/5"
            >
              <div className="absolute top-10 left-10 z-10">
                <div className="flex items-center gap-4 text-paper mb-4">
                  <div className="w-14 h-14 bg-accent rounded-[24px] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <Box className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl tracking-tight">{arProduct.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      <p className="text-[10px] text-paper/40 uppercase tracking-[0.3em] font-bold">Spatial Engine Active</p>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setArProduct(null)}
                className="absolute top-10 right-10 z-10 p-4 bg-white/5 hover:bg-white/10 text-paper rounded-full transition-colors border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <motion.div 
                    animate={{ 
                      rotateY: 360,
                      y: [0, -20, 0]
                    }}
                    transition={{ 
                      rotateY: { duration: 15, repeat: Infinity, ease: "linear" },
                      y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-80 h-80 bg-white/5 rounded-full border border-white/10 flex items-center justify-center mb-12 relative"
                  >
                    <div className="absolute inset-0 bg-accent/10 blur-[60px] rounded-full" />
                    <img src={arProduct.image} alt={arProduct.name} className="w-60 h-60 object-contain drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] relative z-10" />
                  </motion.div>
                  <p className="text-paper/20 text-xs font-bold uppercase tracking-[0.4em]">Scan for Spatial View</p>
                </div>
              </div>

              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                <div className="flex gap-6">
                  <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
                    <p className="text-[9px] text-paper/30 font-bold uppercase tracking-widest mb-2">Dimensions</p>
                    <p className="text-paper font-bold tracking-tight">1:1 Physical Scale</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-md">
                    <p className="text-[9px] text-paper/30 font-bold uppercase tracking-widest mb-2">Environment</p>
                    <p className="text-paper font-bold tracking-tight">Adaptive Occlusion</p>
                  </div>
                </div>
                <div className="w-32 h-32 bg-paper p-3 rounded-[32px] shadow-2xl">
                  {/* Mock QR Code */}
                  <div className="w-full h-full bg-ink rounded-2xl flex items-center justify-center">
                    <div className="w-1/2 h-1/2 border-2 border-paper/20 rounded-lg" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const RecommenderContent = ({ onClose }: any) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    recipient: '',
    occasion: '',
    budget: 2000,
    interests: [] as string[]
  });

  const handleGenerate = async () => {
    setLoading(true);
    setStep(3);
    const res = await getGiftRecommendations(formData.occasion, formData.recipient, formData.budget, formData.interests);
    setRecommendations(res);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[700px]">
      <div className="p-12 bg-ink text-paper flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-accent rounded-full" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-paper/40">Step {step} of 3</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter">Gift <span className="text-display">Wizard.</span></h2>
        </div>
        <button onClick={onClose} className="p-4 hover:bg-white/10 rounded-full transition-colors border border-white/10">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-12 bg-paper/50">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <h3 className="text-3xl font-bold tracking-tight">Who are we <span className="text-display">honoring?</span></h3>
            <div className="grid grid-cols-2 gap-4">
              {['Partner', 'Parent', 'Sibling', 'Friend', 'Child', 'Colleague'].map(p => (
                <button 
                  key={p}
                  onClick={() => { setFormData({ ...formData, recipient: p }); setStep(2); }}
                  className={cn(
                    "p-8 rounded-[32px] border text-left transition-all duration-500",
                    formData.recipient === p ? "bg-ink text-paper border-ink shadow-xl" : "bg-white border-ink/5 hover:border-ink/20 hover:shadow-lg"
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-widest opacity-40 mb-2 block">Recipient</span>
                  <span className="text-xl font-bold tracking-tight">{p}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <h3 className="text-3xl font-bold tracking-tight">Define the <span className="text-display">Context.</span></h3>
            <div className="space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">The Occasion</label>
                <input 
                  type="text" 
                  placeholder="e.g. A Milestone Anniversary"
                  className="w-full bg-white border border-ink/5 rounded-[24px] py-6 px-8 text-lg font-bold focus:ring-2 focus:ring-ink transition-all shadow-sm"
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/30">Investment Range</label>
                  <span className="text-xl font-bold tracking-tighter">₹{formData.budget}</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="50000" 
                  step="500"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) })}
                  className="w-full accent-ink h-1.5 bg-ink/5 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-ink/20">
                  <span>Modest</span>
                  <span>Premium</span>
                  <span>Luxury</span>
                </div>
              </div>
              <button 
                onClick={handleGenerate}
                className="w-full bg-ink text-paper py-6 rounded-[32px] font-bold text-lg flex items-center justify-center gap-4 hover:scale-[1.02] transition-transform active:scale-95 shadow-2xl"
              >
                Synthesize Gift Ideas <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-2 border-ink/5 rounded-full animate-ping" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-ink animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg tracking-tight mb-1">Neural Synthesis in Progress</p>
                  <p className="text-xs text-ink/30 font-bold uppercase tracking-widest">Analyzing thousands of possibilities</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {recommendations.map((rec, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-8 bg-white rounded-[40px] border border-ink/5 flex items-center justify-between group hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="flex-1 pr-8">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-2xl tracking-tight">{rec.name}</h4>
                        <span className="text-[10px] font-bold bg-accent/10 text-accent px-3 py-1 rounded-full uppercase tracking-widest">₹{rec.estimatedPrice}</span>
                      </div>
                      <p className="text-sm text-ink/50 leading-relaxed font-light">{rec.reason}</p>
                    </div>
                    <button className="w-16 h-16 bg-paper rounded-[24px] border border-ink/5 flex items-center justify-center group-hover:bg-ink group-hover:text-paper transition-all duration-500">
                      <ShoppingBag className="w-6 h-6" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
