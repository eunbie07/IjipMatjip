import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, Menu, X } from "lucide-react"; // Menu, X 아이콘 추가

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); // 모바일 메뉴 상태 추가

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowMobileMenu(false); // 모바일 메뉴도 닫기
    navigate("/");
  };

  const handleMobileMenuClose = () => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  };

  return (
    <nav className="bg-surface shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:pl-8 lg:pr-2">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {/* 로고 링크에 아이콘을 추가하고 flex로 정렬합니다. */}
            <a href="/" className="flex items-center text-2xl font-bold text-text-primary">
              <svg className="w-8 h-8 -mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <img src="/ijipmatjip2.png" alt="이집맞집 로고" className="h-6 ml-3 w-auto" />
            </a>
          </div>
          
          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center space-x-1">
            <a
              href="/find-house"
              className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
            >
              Find Your Home
            </a>
            <a
              href="/room-planner"
              className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
            >
              Room Planner
            </a>
            <a
              href="/ai-interior"
              className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
            >
              AI Interior
            </a>

            {/* 인증 관련 버튼 */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors font-bold"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-bold">{user?.email}</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-text-secondary border-b border-border font-bold">
                        {user?.email}
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/my-rooms");
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background font-bold"
                      >
                        내 방 목록
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background font-bold"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-secondary font-bold transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-text-secondary hover:text-text-primary transition-colors p-2"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        {showMobileMenu && (
          <div className="md:hidden bg-surface border-t border-border shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* 메뉴 항목들 */}
              <a
                href="/find-house"
                onClick={handleMobileMenuClose}
                className="block px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
              >
                Find Your Home
              </a>
              <a
                href="/room-planner"
                onClick={handleMobileMenuClose}
                className="block px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
              >
                Room Planner
              </a>
              <a
                href="/ai-interior"
                onClick={handleMobileMenuClose}
                className="block px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-background rounded-md transition-colors font-bold"
              >
                AI Interior
              </a>

              {/* 인증 관련 버튼들 */}
              {isAuthenticated ? (
                <div className="border-t border-border pt-3 mt-3">
                  <div className="px-3 py-2 text-sm text-text-secondary font-bold">
                    {user?.email}
                  </div>
                  <button
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate("/my-rooms");
                    }}
                    className="block w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-background font-bold"
                  >
                    내 방 목록
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-background font-bold"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="border-t border-border pt-3 mt-3 space-y-2">
                  <button
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate("/login");
                    }}
                    className="block w-full text-left px-3 py-2 text-text-secondary hover:bg-background font-bold"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      handleMobileMenuClose();
                      navigate("/signup");
                    }}
                    className="block w-full text-left px-3 py-2 bg-primary text-white rounded-md font-bold"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
