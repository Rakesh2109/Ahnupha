import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, LogOut, LayoutDashboard, Menu, X, ClipboardList } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AhnuphaLogo from './AhnuphaLogo';
import WishlistSidebar from './WishlistSidebar';
import CartSidebar from './CartSidebar';
import { searchData } from '@/lib/searchData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ADMIN_EMAIL = 'info@ahnupha.com';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cart, cartCount } = useCart();
  const { wishlist } = useWishlist();
  const { currentUser, signOut } = useSupabaseAuth();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const navigate = useNavigate();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const menuRef = useRef(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Chocolate', path: '/candy-chocolate' },
    { name: 'Customize', path: '/customize', highlight: true },
    { name: 'Snacks', path: '/snacks' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      const filtered = searchData.filter(item => 
        item.title.toLowerCase().includes(query) || 
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
      setSearchResults(filtered);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery]);

  // Click outside to close search dropdown and collapse search
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on input or inside search container
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Check if clicking on the search input itself
        if (searchInputRef.current && searchInputRef.current.contains(event.target)) {
          return;
        }
        setShowSearchDropdown(false);
        if (!searchQuery.trim()) {
          setIsSearchExpanded(false);
        }
      }
    };
    if (isSearchExpanded || showSearchDropdown) {
      // Use a slight delay to avoid interfering with input focus
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 300);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSearchExpanded, showSearchDropdown, searchQuery]);

  // Click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Check if clicking on menu button
        const menuButton = event.target.closest('button[aria-label*="menu"], button:has(svg)');
        if (menuButton && menuButton.textContent === '' && menuButton.querySelector('svg')) {
          // This is likely the menu toggle button, let it handle the toggle
          return;
        }
        // Check if clicking on profile dropdown
        const profileDropdown = event.target.closest('[role="menu"], [data-radix-popper-content-wrapper]');
        if (profileDropdown) {
          setIsMenuOpen(false);
          return;
        }
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  // Auto-focus input when search expands
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      // Use requestAnimationFrame for better focus handling
      requestAnimationFrame(() => {
        setTimeout(() => {
          searchInputRef.current?.focus();
          // Ensure cursor is at the end
          if (searchInputRef.current) {
            const length = searchInputRef.current.value.length;
            searchInputRef.current.setSelectionRange(length, length);
          }
        }, 150);
      });
    }
  }, [isSearchExpanded]);

  const handleSearchNavigate = (path) => {
    navigate(path);
    setShowSearchDropdown(false);
    setSearchQuery('');
    setIsSearchExpanded(false);
    setIsMenuOpen(false);
  };

  const handleSearchIconClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchClose = () => {
    setIsSearchExpanded(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  // Helper to highlight matching text
  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-yellow-200 text-gray-900 font-semibold">{part}</span> : part
        )}
      </span>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/98 backdrop-blur-md border-b border-gray-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex h-20 items-center justify-between gap-4">
            
            {/* Logo - smaller on mobile so menu/cart fit */}
            <div className="flex-shrink-0 flex items-center min-w-0">
              <Link to="/" className="group transition-transform duration-300 hover:scale-105">
                <AhnuphaLogo className="h-16 sm:h-20 md:h-28 lg:h-32 w-auto transition-all" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                link.highlight ? (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md hover:shadow-lg hover:from-rose-600 hover:to-amber-600 transition-all duration-300 tracking-wide"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {link.name}
                  </Link>
                ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-bold text-gray-700 hover:text-rose-600 transition-all duration-300 relative group tracking-wide"
                >
                  {link.name}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                )
              ))}
            </nav>

            {/* Search - Desktop & Tablet */}
            <div className="hidden md:flex items-center mx-4 relative" ref={searchRef}>
              {!isSearchExpanded ? (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative hover:bg-rose-50/50 transition-all duration-200"
                  onClick={handleSearchIconClick}
                  type="button"
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5 text-gray-600 hover:text-rose-600 transition-colors duration-200" />
                </Button>
              ) : (
                <div className="relative w-[400px] animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="relative w-full">
                    <Input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search products..." 
                      className="w-full pl-10 pr-10 h-12 bg-white border-2 border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200/50 rounded-xl text-base shadow-lg transition-all duration-200 font-medium"
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        if (value.trim().length > 0) {
                          setShowSearchDropdown(true);
                        } else {
                          setShowSearchDropdown(false);
                        }
                      }}
                      onFocus={(e) => {
                        e.stopPropagation();
                        if (searchQuery.trim().length > 0) {
                          setShowSearchDropdown(true);
                        }
                      }}
                      onKeyDown={(e) => {
                        // Prevent closing on Escape if there's text
                        if (e.key === 'Escape' && !searchQuery.trim()) {
                          handleSearchClose();
                        }
                        // Prevent event bubbling
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500 pointer-events-none" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSearchClose();
                      }}
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50/50 rounded-lg transition-all duration-200"
                      aria-label="Close search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchDropdown && searchQuery.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 w-full bg-white border-2 border-rose-500 border-t-0 rounded-b-xl shadow-2xl z-[100] max-h-[70vh] overflow-hidden mt-0">
                      <div className="overflow-y-auto max-h-[70vh]">
                        {searchResults.length > 0 ? (
                          <div className="py-2">
                            {searchResults.map((item) => (
                              <button 
                                key={item.id}
                                onClick={() => handleSearchNavigate(item.path)}
                                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-rose-50/50 text-left transition-all duration-200 border-b border-gray-100 last:border-0 group"
                              >
                                {item.image ? (
                                  <img 
                                    src={item.image} 
                                    alt={item.title} 
                                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-gray-200 group-hover:border-rose-300 transition-all duration-200 shadow-sm" 
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Search className="w-6 h-6 text-rose-600" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-semibold text-gray-900 mb-1">
                                    <HighlightText text={item.title} highlight={searchQuery} />
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-300 text-gray-600">
                                      {item.category || item.type}
                                    </Badge>
                                    {item.price && (
                                      <span className="text-sm font-bold text-rose-600">₹{item.price}</span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-6 py-12 text-center">
                            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-base font-semibold text-gray-700 mb-1">No results found</p>
                            <p className="text-sm text-gray-500">We couldn't find anything matching "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions - flex-shrink-0 so menu button is never squeezed */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Search Icon for Mobile/Tablet when not expanded */}
              {!isSearchExpanded && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative md:hidden hover:bg-rose-50/50 transition-all duration-200"
                  onClick={handleSearchIconClick}
                  aria-label="Search products"
                >
                  <Search className="w-5 h-5 text-gray-600 hover:text-rose-600 transition-colors duration-200" />
                </Button>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                className="relative hidden sm:flex hover:bg-rose-50/50 transition-all duration-200"
                onClick={() => setIsWishlistOpen(true)}
                aria-label={wishlist.length > 0 ? `Wishlist (${wishlist.length} items)` : 'Open wishlist'}
              >
                <Heart className="w-5 h-5 text-gray-600 hover:text-rose-600 transition-colors duration-200" />
                {wishlist.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 rounded-full text-[10px] text-white shadow-lg" aria-hidden>
                    {wishlist.length}
                  </Badge>
                )}
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                type="button"
                className="relative cursor-pointer hover:bg-rose-50/50 transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsCartOpen(true);
                }}
                aria-label={cartCount > 0 ? `Cart (${cartCount} items)` : 'Open cart'}
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 hover:text-rose-600 transition-colors duration-200" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 rounded-full text-[10px] text-white z-10 shadow-lg" aria-hidden>
                    {cartCount}
                  </Badge>
                )}
              </Button>

              {currentUser ? (
                <DropdownMenu onOpenChange={(open) => {
                  if (open) {
                    setIsMenuOpen(false);
                  }
                }}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2 hover:ring-2 hover:ring-rose-100 transition-all duration-200">
                      <Avatar className="h-9 w-9 border-2 border-gray-100 shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.id}`} alt={currentUser.email || currentUser.phone} loading="lazy" />
                        <AvatarFallback className="bg-gradient-to-br from-rose-500 to-amber-500 text-white font-semibold">{(currentUser.email || currentUser.phone || 'U').charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 border-gray-100 shadow-xl" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{currentUser.user_metadata?.name || currentUser.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email || currentUser.phone || 'Account'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="hover:bg-rose-50/50 transition-colors">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/handicraft')} className="hover:bg-rose-50/50 transition-colors">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        <span>Manual Orders</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 hover:bg-red-50/50 transition-colors">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-3 ml-2">
                  <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white rounded-full px-5 shadow-md hover:shadow-lg transition-all duration-200" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button (3-line hamburger) - always visible on lg breakpoint and below */}
              <button
                type="button"
                className="lg:hidden flex-shrink-0 min-w-[44px] min-h-[44px] p-2 flex items-center justify-center text-gray-700 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all duration-200 touch-manipulation border border-transparent hover:border-rose-200"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {isSearchExpanded && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md relative animate-in slide-in-from-top-4 duration-200" ref={searchRef}>
              <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100">
                <div className="relative">
                  <Input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Search products..." 
                    className="w-full pl-12 pr-12 h-14 bg-white border-2 border-rose-500 focus:border-rose-600 focus:ring-2 focus:ring-rose-200/50 rounded-xl text-base z-10"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (e.target.value.trim().length > 0) {
                        setShowSearchDropdown(true);
                      }
                    }}
                    onFocus={() => {
                      if (searchQuery.trim().length > 0) {
                        setShowSearchDropdown(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape' && !searchQuery.trim()) {
                        handleSearchClose();
                      }
                    }}
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-500 pointer-events-none z-20" />
                  <button
                    onClick={handleSearchClose}
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-rose-600 z-20 rounded-lg transition-colors duration-200 touch-manipulation"
                    aria-label="Close search"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Mobile Search Results */}
                {showSearchDropdown && searchQuery.trim().length > 0 && (
                  <div className="border-t border-gray-200 max-h-[60vh] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((item) => (
                          <button 
                            key={item.id}
                            onClick={() => handleSearchNavigate(item.path)}
                            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-rose-50/50 text-left transition-all duration-200 border-b border-gray-100 last:border-0"
                          >
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border border-gray-200 shadow-sm" />
                            ) : (
                              <div className="w-16 h-16 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Search className="w-6 h-6 text-rose-500" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900 mb-1">
                                <HighlightText text={item.title} highlight={searchQuery} />
                              </p>
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="text-xs px-2 py-0.5 border-gray-300 text-gray-600">
                                  {item.category || item.type}
                                </Badge>
                                {item.price && <span className="text-sm font-bold text-rose-600">₹{item.price}</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-base font-semibold text-gray-700 mb-1">No results found</p>
                        <p className="text-sm text-gray-500">We couldn't find anything matching "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div ref={menuRef} className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md absolute w-full left-0 shadow-xl z-50 max-h-[calc(100vh-80px)] overflow-y-auto">
            <div className="p-4 space-y-4">
              <Button 
                variant="outline"
                className="w-full justify-start text-left font-normal h-12 border-gray-200 hover:bg-rose-50/50 transition-all duration-200"
                onClick={handleSearchIconClick}
              >
                <Search className="mr-2 h-5 w-5 text-gray-500" />
                <span className="text-gray-500">Search products...</span>
              </Button>
              <nav className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  link.highlight ? (
                    <Link
                      key={link.name}
                      to={link.path}
                      className="px-4 py-3 text-base font-bold text-rose-600 bg-rose-50/60 rounded-xl transition-all duration-200 flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-500" />
                      {link.name}
                      <span className="ml-auto text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-amber-500 px-2 py-0.5 rounded-full">New</span>
                    </Link>
                  ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="px-4 py-3 text-base font-medium text-gray-600 hover:bg-rose-50/50 hover:text-rose-500 rounded-xl transition-all duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                  )
                ))}
                 {!currentUser && (
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-2">
                      <Link 
                        to="/login" 
                        className="px-4 py-3 text-base font-medium text-center text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </div>
                 )}
              </nav>
            </div>
          </div>
        )}
      </header>

      <WishlistSidebar isOpen={isWishlistOpen} onClose={() => setIsWishlistOpen(false)} />
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Header;