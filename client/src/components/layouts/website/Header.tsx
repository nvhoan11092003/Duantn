import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AiOutlineUser, } from "react-icons/ai";
import { CiSettings, CiSearch } from "react-icons/ci";
import { LiaShoppingBasketSolid } from "react-icons/lia"
import { FaBars } from "react-icons/fa"
import { GoSignOut } from "react-icons/go"
import { useCallback, useEffect, useState } from "react";
import { HiOutlineX } from "react-icons/hi"
import { RiUserLine } from "react-icons/ri"
import Marquee from "react-fast-marquee";
import { CiHeart } from "react-icons/ci";

import "./style.css"
import { BiHelpCircle, BiChevronDown } from "react-icons/bi";
import { IUser } from "../../../store/Auth/Auth.interface";
import { useGetCartQuery, useGetWishListQuery } from "../../../store/Auth/Auth.services";
import { toastError } from "../../../hook/toastify";

type UserMenuProps = {
  currentUser: IUser | null;
};
const Header = ( { currentUser }: UserMenuProps ) =>
{
  const location = useLocation();

  // Default to 0 if cart or items array is null or undefined
  const { data: wistListProduct, refetch } = useGetWishListQuery( [] )

  const { data: cart } = useGetCartQuery( [] );

  useEffect( () =>
  {
    const fetchData = async () =>
    {
      try
      {
        // Gọi hàm refetch để tải lại dữ liệu giỏ hàng
        await refetch();
        // Dữ liệu product detail dc cập nhật 
      } catch ( error: any )
      {
        toastError( error.data.error )   // Xử lý lỗi nếu có
      }
    };

    fetchData(); // Gọi hàm fetchData khi location.pathname thay đổi
  }, [ location.pathname, refetch ] );
  const navigate = useNavigate();
  const [ isOpen, setIsOpen ] = useState( false );
  const togglesDropdown = () =>
  {
    setIsOpen( ( isOpen ) => !isOpen );
  };

  const closesDropdown = () =>
  {
    setIsOpen( false );
  };
  const [ isOpens, setIsOpens ] = useState( false );
  const togglesDropdowns = () =>
  {
    setIsOpens( ( isOpens ) => !isOpens );
  };

  const closesDropdowns = () =>
  {
    setIsOpens( false );
  };



  const [ isSearchVisible, setIsSearchVisible ] = useState( false );
  const [ searchInput, setSearchInput ] = useState( "" );

  const toggleSearch = () =>
  {
    setIsSearchVisible( !isSearchVisible );
  };

  const handleInputChange = ( e: any ) =>
  {
    setSearchInput( e.target.value );
  };

  const clearSearchInput = () =>
  {
    setSearchInput( "" );
  };
  const [ issOpen, setIssOpen ] = useState( false );
  const [ isProductDropdownOpen, setIsProductDropdownOpen ] = useState( false );
  const toggleMenu = useCallback( () =>
  {
    setIsProductDropdownOpen( ( value ) => !value )
  }, [] )
  const toggleDropdown = () =>
  {
    setIssOpen( ( isOpen ) => !isOpen );
  };

  const closeDropdown = () =>
  {
    setIssOpen( false );
  };

  const logOut = () =>
  {
    localStorage.removeItem( "token" );
    navigate( "/login" );
  };

  const check = localStorage.getItem( 'token' ); // Lấy token từ Local Storage
  const cartItemCount = cart?.items?.length || 0;
  const wishList = wistListProduct?.wishList.length || 0
  useEffect( () =>
  {
    if ( !check )
    {
      // Nếu không có token (đã đăng xuất), cập nhật lại giá trị cartItemCount
      const wishList = 0
      console.log( wishList );
      refetch()
      const cartItemCount = 0;
      console.log( cartItemCount );
    }
  }, [ check ] );



  return (
    <>

      <div className="   text-black  text-base bg-[#ffffff] ">
        <Marquee className='d-flex bg-black-500 text-center text-white text-sm font-medium py-3'>
          <p className="ml-40">FREE ship cho đơn hàng 500k </p>
          <span className="text-white ml-40 ">.</span>
          <p className="ml-40">Tặng quần Boxer cho đơn hàng 500k </p>
          <span className="text-white ml-40 ">.</span>
          <p className="ml-40">FREE ship cho đơn hàng 500k </p>
          <span className="text-white ml-40 ">.</span>
          <p className="ml-40">Tặng quần Boxer cho đơn hàng 500k </p>
          <span className="text-white ml-40 ">.</span>


        </Marquee>

        <header className="py-3 flex    justify-center justify-between ">
          <div className="flex items-center w-2/4 justify-between   ml-16">
            <button className="md:hidden block" onClick={ toggleMenu } >
              <FaBars />
            </button>

            <nav className="flex font-monster hidden md:block flex-wrap flex-row items-center">
              <div className={ isProductDropdownOpen ? "open flex items-center" : "flex items-center gap-10" }>
                <ul className="flex items-center gap-5 ">
                  <li>
                    <Link to={ "" } className="p-3 inline-block hover:text-gray-500 relative">
                      New In
                    </Link>
                  </li>


                  <li className="relative z-50">
                    <button className="ml-1 flex items-center" onClick={ togglesDropdown }>
                      Tất cả sản phẩm
                      <BiChevronDown />
                    </button>
                    { isOpen && (
                      <div className="absolute right-0 py-3 mt-2 w-48 bg-white border border-gray-300 rounded-lg">
                        {/* Các mục menu dropdown */ }
                        <div className="flex flex-col px-8">
                          <li>

                            <Link to="/collection" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdown }>
                              Bộ sưu tập                                               
                            </Link>                            
                          </li>
                          <li className="mt-2">
                            <Link to="products" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdown }>
                              Tất cả sản phẩm
                             
                            </Link>
                          </li>
                        </div>
                      </div>
                    ) }
                  </li>
                  <li className="relative z-50">
                    <button className="flex items-center" onClick={ togglesDropdowns }>
                      Chính sách
                      <BiChevronDown className="ml-1" />
                    </button>
                    { isOpens && (
                      <div className="absolute mt-2  w-60 bg-white py-3 border border-gray-300 rounded-lg shadow-lg">
                        {/* Các mục menu dropdown */ }
                        <div className="flex flex-col px-8 ">
                          <li>
                            <Link to="inspection" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                              Chính sách kiểm hàng
                              <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                            </Link>
                          </li>
                          <li className="mt-2">
                            <Link to="exchange" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                              Chính sách đổi/hoàn trả
                              <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                            </Link>
                          </li>
                          <li className="mt-2">
                            <Link to="warranty" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                              Chính sách bảo hành
                              <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                            </Link>
                          </li>
                          <li className="mt-2">
                            <Link to="privacy" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                              Chính sách bảo mật
                              <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                            </Link>
                          </li>
                          <li className="mt-2">
                            <Link to="rules" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                              Điều khoản sử dụng
                              <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                            </Link>
                          </li>
                          <li className="mt-2">
                            <Link to="contact" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                              Liên hệ
                              <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                            </Link>
                          </li>
                        </div>
                      </div>
                    ) }
                  </li>
                </ul>
              </div>
            </nav>
            <div className="font-serif text-[#404040]">Bee Fashion</div>

          </div>


          <nav className="">
            <ul className="flex flex-row mt-2 mr-16 gap-3">
              <Link className="ml-2 h-6 w-6 relative" to="wishList">
                <button className="">
                  <CiHeart className="h-6 w-6" />
                </button>
                { check && wishList > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-2">
                    { wishList }
                  </span>
                ) }
              </Link>

              <div onClick={ toggleSearch } >
                <span className="inline-block">
                  <CiSearch className="w-6 h-6" />
                </span>
              </div>
              { check ? (
                <div className="relative z-10">
                  <button className="flex items-center rounded-full px-2 ml-2 text-blue-gray-900 hover:bg-blue-gray-100 focus:outline-none focus:bg-blue-gray-100" onClick={ toggleDropdown }>
                    <RiUserLine className="h-6 w-6" />
                  </button>
                  { issOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-300 rounded-lg shadow-lg">
                      {/* Các mục menu dropdown */ }
                      <div className="flex flex-col">
                        <ul>
                          <li>
                            <Link to="profile" className="flex items-center px-4 py-2 text-black-500 hover:bg-blue-100" onClick={ closeDropdown }>
                              <AiOutlineUser className="w-5 h-5 mr-2" />
                              Thông tin cá nhân
                            </Link>
                          </li>
                          <li>
                            <Link to="LoginAdmin" className="flex items-center px-4 py-2 text-black-500 hover:bg-blue-100" onClick={ closeDropdown }>
                              <CiSettings className="w-5 h-5 mr-2" />
                              Cài đặt
                            </Link>
                          </li>
                          <hr />
                          <li>
                            <Link to="#" className="flex items-center px-4 py-2 text-black-500 hover:bg-blue-100" onClick={ closeDropdown }>
                              <img src="./2-layers.svg" className="w-5 h-5 mr-2" />
                              Nhật kí
                            </Link>
                          </li>
                          <li>
                            <Link to="#" className="flex items-center px-4 py-2 text-black-500 hover:bg-blue-100" onClick={ closeDropdown }>
                              <BiHelpCircle className="w-5 h-5 mr-2" />
                              Hỗ trợ
                            </Link>
                          </li>
                          <li>
                            <hr className="my-1 border-t border-gray-200" />
                          </li>
                          <li>
                            <Link to="#" className="flex items-center px-4 py-2 text-black-500 hover:bg-red-100 w-full transition-colors duration-300" onClick={ logOut }>
                              <GoSignOut className="w-5 h-5 mr-2" />
                              Đăng Xuất
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) }
                </div>
              ) : (
                <Link to="/login">
                  <button className="ml-2">
                    <RiUserLine className="h-6 w-6" />
                  </button>
                </Link>
              ) }

              <Link className="ml-2 h-6 w-6 relative" to="">
                <Link to="cart">
                  <span className="inline-block">
                    <LiaShoppingBasketSolid className="w-6 h-6" />
                  </span>
                  {/* Display the cart item count */ }
                  { check && cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-2">
                      { cartItemCount }
                    </span>
                  ) }
                </Link>
              </Link>
            </ul>
          </nav>
        </header>
        { isProductDropdownOpen && (
          <nav className="flex font-monster md:hidden  justify-center">
            <div className={ "flex items-center gap-10" }>
              <ul className="flex items-center gap-5">
                <li>
                  <Link to={ "" } className="p-3 inline-block hover:text-gray-500 relative">
                    New In
                  </Link>
                </li>

                <li className="relative z-50">
                  <Link className="ml-1 flex  items-center" to={ "" } onClick={ togglesDropdown }>
                    Tất cả sản phẩm
                    <BiChevronDown />
                  </Link>
                  { isOpen && (
                    <div className="absolute text-xs right-0 py-3 mt-2 w-35 bg-white border border-gray-300 rounded-lg">
                      {/* Các mục menu dropdown */ }
                      <div className="flex flex-col px-6">
                        <li>
                          <Link to="profile" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdown }>
                            Bộ sưu tập
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                        <li className="mt-2">
                          <Link to="admin" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdown }>
                            Tất cả sản phẩm
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                      </div>
                    </div>
                  ) }
                </li>
                <li className="relative z-50">
                  <Link to={ "" } className="flex items-center" onClick={ togglesDropdowns }>
                    Chính sách
                    <BiChevronDown className="ml-1" />
                  </Link>
                  { isOpens && (
                    <div className="absolute mt-2 px-6 text-xs w-40 bg-white py-3 border border-gray-300 rounded-lg shadow-lg">
                      {/* Các mục menu dropdown */ }
                      <div className="flex flex-col">
                        <li>
                          <Link to="profile" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                            Chính sách kiểm hàng
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                        <li className="mt-2">
                          <Link to="admin" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                            Chính sách đổi / hoàn trả
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                        <li className="mt-2">
                          <Link to="admin" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                            Chính sách bảo hành
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                        <li className="mt-2">
                          <Link to="admin" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                            Chính sách bảo mật
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                        <li className="mt-2">
                          <Link to="admin" className="relative group inline-block text-[#5A6D57] hover:text-black-500 transition-colors duration-300" onClick={ closesDropdowns }>
                            Điều khoản sử dụng
                            <div className="h-0.5 w-full bg-gray-700 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></div>
                          </Link>
                        </li>
                      </div>
                    </div>
                  ) }
                </li>
              </ul>
            </div>
          </nav>
        ) }
        <form
          className={ `text-sm md:text-lg lg:text-xl xl:text-xl relative items-center py-5 ml-16 mr-16 search-form ${ isSearchVisible ? "visible" : ""
            }` }
          action=""
        >
          <div className="relative">
            <input
              className="w-full h-10 pl-10 pr-16 font-size:16px outline-none"
              type="text"
              name="search"
              placeholder="Tìm Kiếm"
              value={ searchInput }
              onChange={ handleInputChange }
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <CiSearch />
            </span>
            { searchInput && (
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={ clearSearchInput }
              >
                <HiOutlineX />
              </span>
            ) }
          </div>
          <hr />
        </form>

      </div>
    </>
  );
};

export default Header;
