// import React from 'react'
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import "react-multi-carousel/lib/styles.css";
import { useGetProductsQuery } from "../../store/products/product.services";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useGetproductDiscountApiQuery, useGetproductDiscountApiSoldQuery } from "../../store/productDiscount/productDiscont";
import { useGetCategoryListQuery } from "../../store/categoies/category.services";
import { useSaveVoucherMutation } from "../../store/Auth/Auth.services";
import { toastError, toastSuccess } from "../../hook/toastify";
import { useGetVoucherListQuery } from "../../store/voucher/voucher.service";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: vouchers } = useGetVoucherListQuery(null)
  const [voucherss] = useSaveVoucherMutation()
  const [isVoucherSaved, setIsVoucherSaved] = useState(false);
  
  console.log(vouchers);
  const { data: productList, isLoading, isError, refetch } = useGetProductsQuery({
    gte: 0, // Assuming value[0] contains the minimum price
    lte: 10000000, // Assuming value[1] contains the maximum price
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        await refetch();
      } catch (error: any) {
        toastError(error.data.error)   // Xử lý lỗi nếu có
      }
    };

    fetchData(); // Kích hoạt fetch data khi location.pathname thay đổi
  }, [location.pathname, refetch]);

  const { data: productsold } = useGetproductDiscountApiSoldQuery(null)
  const { data: productDiscont } = useGetproductDiscountApiQuery(null)
  const { data: categories } = useGetCategoryListQuery(null)

  const saveVoucher = (voucherId: any) => {
    console.log(voucherId);

    voucherss(voucherId).unwrap().then((response: any) => {
      console.log(response);
      setIsVoucherSaved(true);
      toastSuccess("Đã lưu voucher")
    }).catch((error) => {
      toastError(error.data.message)
    })

  };
  const handleGetProductDetail = (idProduct: string) => {
    window.scrollTo(0, 0);
    navigate(`/home/product-detail/${idProduct}`)
  }




  return (
    <div className="mx-auto items-center">
      {/* banner */}
      <div className="flex items-center justify-center sm:justify-start">
        <img src="/bannerfirst.jpg" alt="" className="w-full sm:w-auto" />
      </div>

      {/* Danh mục sản phẩm */}
      <div className="flex flex-col  space-x-[20px] mt-[20px] ml-[100px]">
      </div>
      <Marquee className='  text-center text-sm font-medium py-3'>
        <div className="flex space-x-4">
          {
            vouchers?.data?.map((voucher: any) => (
              <div key={voucher?._id} className="bg-gray-200 space-x-5  rounded-full p-2 text-sm font-medium flex items-center">
                <p>{voucher.name}</p>
                <div> Mã code: {voucher.code}  (Giảm {voucher.discount}%)</div>
                <button
                  onClick={() => saveVoucher(voucher?._id)}
                  disabled={isVoucherSaved} // Check if the voucher ID exists in the user's list
                  className={`ml-2 ${isVoucherSaved ? 'bg-gray-400' : 'bg-blue-500'} text-white px-2 py-1 rounded-md text-xs font-medium`}
                >
                  {isVoucherSaved ? 'Voucher Đã Lưu' : 'Nhận'}
                </button>
              </div>
            ))}
        </div>
      </Marquee>
      <h1 className="text-4xl sm:text-6xl font-[Noto sans] text-[#23314B] font-medium md:pt-10 lg:pt-16 text-center">Danh Mục Sản Phẩm</h1>
      <div className="flex space-x-[20px] mt-[20px] ml-[100px]">
        {
          categories?.data.map((category: any) => {
            return (
              <div className="relative w-full sm:w-80 flex-col rounded-xl bg-clip-border text-gray-700 overflow-hidden">
                <div className="relative h-96 sm:h-100 overflow-hidden rounded-xl bg-clip-border text-gray-700 group">
                  <div className="object-cover w-full transform scale-100 group-hover:scale-105 transition-transform bg-gray-600">
                    <img className="object-cover w-full opacity-70" src={category?.image.url} alt="profile-picture" />
                    <Link to={`/products/${category._id}`}>
                      <p className="absolute text-white top-[170px] left-[30%] text-[25px] font-semibold text-center">{category?.title}</p>
                      <p className="text-white pt-[100px] font-[Noto Sans] text-[20px] font-bold absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-chevron-circle-right fa-2x"></i>
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
      </div>




      <div className="grid grid-cols-3 ">
        <div>
          <h1 className="text-[44px] leading-[48px] font-[Noto sans]  text-[#23314B] font-semibold  md:pt-[50px] lg:pt-[40px] md:[40px] lg:[60px] ml-[100px] mb-[50px]">Sản Phẩm Mới</h1>
        </div>
        <div>

        </div>
        <div className="space-x-2 flex">
          <div>
            <Link to="/products">
              <h2 className="mt-[50px] font-thin text-[20px] py-1.5 text-[#23314bb3]  ml-[150px] inline-block relative after:absolute after:bottom-2 after:left-0 after:bg-gray-700 after:h-0.5 hover:after:w-full after:w-0 after:transition-all after:ease-in-out after:duration-300">Xem toàn bộ sản phẩm  </h2>
            </Link>
          </div>
          <div className="mt-[55px]">
            <span className="inline-block  p-1.5  bg-[#23314b1a] rounded-full group hover:bg-[#23314b] transform transition-transform duration-300 ">
              <MdOutlineKeyboardArrowRight className="text-[#23314b] text-[14px] group-hover:text-white  " />
            </span>
          </div>
        </div>
      </div>


      {/* sản phẩm mới */}

      <div className="grid grid-cols-3 space-x-5 ml-[100px]">
        {productList?.products?.map((product: any) => {
          return (

            <div className="relative w-full sm:w-96 rounded-xl bg-white bg-clip-border text-gray-700 group">
              <button onClick={() => handleGetProductDetail(product._id)} className="" key={product._id}>
                <div className="relative h-100 mt-[20px] rounded-xl bg-white bg-clip-border text-gray-700 overflow-hidden group-hover:scale-105 transition-transform duration-300 ease-in-out">
                  {product.original_price && (

                    <p className="absolute z-10 top-3 left-3 bg-[#f83a3a] text-[8px] sm:text-xs font-semibold rounded-full text-white px-2 py-[3px]">
                      Tiết kiệm {(product.price - product.original_price).toLocaleString()} đ
                    </p>

                  )}
                  <img className="object-cover w-full" src={product?.images[0]?.url} alt="profile-picture" />
                  <p className="text-center text-[20px] font-semibold mt-2">{product.name}</p>
                  <div className="flex space-x-4 ml-[120px] mb-4 text-center">
                    <p className="flex space-x-4 mt-2">
                      {/* Hiển thị điều kiện dựa trên sự tồn tại của original_price */}
                      {product.original_price ? (
                        <>
                          <span className="text-[#f83a3a] text-sm md:text-base font-extralight">{product.original_price.toLocaleString()}₫</span>
                          <span className="line-through text-sm md:text-base font-extralight text-[#23314bb3]">{product.price.toLocaleString()}₫</span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base font-extralight text-[#23314bb3] pl-[30px]"> {/* Căn giữa giá */}
                          {product.price.toLocaleString()}₫
                        </span>
                      )}
                    </p>
                  </div>
                  <button onClick={() => handleGetProductDetail(product._id)} className="absolute top-[70%] right-0 bg-[#23314b] text-white text-center py-2 hover:bg-transparent hover:text-[#23314b] hover:border-2 hover:border-[#23314b] transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 rounded-full w-[150px]">
                    + Thêm nhanh
                  </button>
                </div>
              </button>
            </div>
          );
        })}
      </div>








      {/*sản phẩm bán chạy*/}


      <div className="grid grid-cols-3 ">
        <div>
          <h1 className="text-[44px] leading-[48px]  font-[Noto sans]  text-[#23314B] font-semibold  md:pt-[50px] lg:pt-[40px] md:[40px] lg:[60px] ml-[80px] mb-[50px]">Sản Phẩm Bán Chạy</h1>
        </div>
        <div>

        </div>
        <div className="space-x-2 flex">
          <div>
            <h2 className="mt-[50px] font-thin text-[20px] py-1.5 text-[#23314bb3]  ml-[150px] inline-block relative after:absolute after:bottom-2 after:left-0 after:bg-gray-700 after:h-0.5 hover:after:w-full after:w-0 after:transition-all after:ease-in-out after:duration-300">Xem thêm </h2>
          </div>
          <div className="mt-[55px]">
            <span className="inline-block  p-1.5  bg-[#23314b1a] rounded-full group hover:bg-[#23314b] transform transition-transform duration-300 ">
              <MdOutlineKeyboardArrowRight className="text-[#23314b] text-[14px] group-hover:text-white  " />
            </span>
          </div>
        </div>
      </div>


      {/* sản phẩm bán chạy */}

      <div className="grid grid-cols-3">
        {productsold?.productsSoldOverTwenty?.map((product: any) => {
          return (
            <Link to={`/home/product-detail/${product._id}`} key={product._id} className="flex flex-row sm:flex-row mx-auto justify-center mt-10 mb-10 space-y-6 sm:space-y-0 sm:space-x-6 max-w-screen-xl">
              {/* Card 1 */}
              <div className="relative w-full sm:w-96 flex-col rounded-xl bg-white bg-clip-border text-gray-700 group">
                <div className="relative h-100 rounded-xl bg-white bg-clip-border text-gray-700 overflow-hidden group-hover:scale-105 transition-transform duration-300 ease-in-out">
                  {product.original_price && (
                    <p className="absolute z-10 top-3 left-3 bg-[#f83a3a] text-[8px] sm:text-xs font-semibold rounded-full text-white px-2 py-[3px]">
                      Tiết kiệm {product.price - product.original_price} đ
                    </p>
                  )}


                  <img className="object-cover w-full" src={product?.images[0]?.url} alt="profile-picture" />
                  <p className="text-center text-[20px] font-semibold">{product.name}</p>

                  <div className="flex space-x-4 pl-[130px] mb-4">
                    {product.original_price ? (
                      <>
                        <span className="text-[#f83a3a] text-sm md:text-base font-extralight text-center">{product.original_price.toLocaleString()}₫</span>
                        <span className="line-through text-sm md:text-base font-extralight text-[#23314bb3]">{product.price.toLocaleString()}₫</span>
                      </>
                    ) : (
                      <span className="text-sm md:text-base font-extralight text-align-center text-[#23314bb3]">{product.price.toLocaleString()}₫</span>
                    )}
                  </div>
                  <button onClick={() => handleGetProductDetail(product._id)} className="absolute top-[70%] right-0 bg-[#23314b] text-white text-center py-2 hover:bg-transparent hover:text-[#23314b] hover:border-2 hover:border-[#23314b] transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 rounded-full w-[150px]">
                    + Thêm nhanh
                  </button>
                </div>



              </div>



            </Link>
          );
        })}
      </div>


      <div className="grid grid-cols-3 ">
        <div>
          <h1 className="text-[44px] leading-[48px]  font-[Noto sans]  text-[#23314B] font-semibold  md:pt-[50px] lg:pt-[40px] md:[40px] lg:[60px] ml-[80px] mb-[50px]">Sản Phẩm Giảm Giá</h1>
        </div>
        <div>

        </div>
        <div className="space-x-2 flex">
          <div>
            <h2 className="mt-[50px] font-thin text-[20px] py-1.5 text-[#23314bb3]  ml-[150px] inline-block relative after:absolute after:bottom-2 after:left-0 after:bg-gray-700 after:h-0.5 hover:after:w-full after:w-0 after:transition-all after:ease-in-out after:duration-300">Xem thêm </h2>
          </div>
          <div className="mt-[55px]">
            <span className="inline-block  p-1.5  bg-[#23314b1a] rounded-full group hover:bg-[#23314b] transform transition-transform duration-300 ">
              <MdOutlineKeyboardArrowRight className="text-[#23314b] text-[14px] group-hover:text-white  " />
            </span>
          </div>
        </div>
      </div>

      {/* sản phẩm giảm giá*/}

      <div className="grid grid-cols-3">
        {productDiscont?.productsWithDiscount?.map((product: any) => {
          return (
            <Link to={`/home/product-detail/${product._id}`} key={product._id} className="flex flex-row sm:flex-row mx-auto justify-center mt-10 mb-10 space-y-6 sm:space-y-0 sm:space-x-6 max-w-screen-xl">
              {/* Card 1 */}
              <div className="relative w-full sm:w-96 flex-col rounded-xl bg-white bg-clip-border text-gray-700 group">
                <div className="relative h-100 rounded-xl bg-white bg-clip-border text-gray-700 overflow-hidden group-hover:scale-105 transition-transform duration-300 ease-in-out">

                  <p className="absolute z-10 top-3 left-3 bg-[#f83a3a] text-[8px] sm:text-xs font-semibold rounded-full text-white px-2 py-[3px]">
                    Tiết kiệm {product.discountProduct.toLocaleString()}đ
                  </p>


                  <img className="object-cover w-full" src={product?.images[0]?.url} alt="profile-picture" />
                  <p className="text-center text-[20px] font-semibold">{product.name}</p>

                  <div className="flex space-x-4 pl-[130px] mb-4">
                    <>
                      <span className="text-[#f83a3a] text-sm md:text-base font-extralight text-center">{product.original_price.toLocaleString()}₫</span>
                      <span className="line-through text-sm md:text-base font-extralight text-[#23314bb3]">{product.price.toLocaleString()}₫</span>
                    </>


                  </div>
                  <button onClick={() => handleGetProductDetail(product._id)} className="absolute top-[70%] right-0 bg-[#23314b] text-white text-center py-2 hover:bg-transparent hover:text-[#23314b] hover:border-2 hover:border-[#23314b] transition-all duration-300 ease-in-out opacity-0 group-hover:opacity-100 rounded-full w-[150px]">
                    + Thêm nhanh
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>




      {/* banner dưới */}
      <div className="w-full relative text-center mb-[90px] ">
        <img src="/bannerdown.jpg" alt="" className="w-full  sm:w-[1700px] h-[450px] mt-[100px]" />
        <div className="absolute top-[120px] left-[50%] text-white transform -translate-x-1/2">
          <p className="md:text-[10px] lg:text-[20px] font-[Noto Sans] font-bold">Định vị thương hiệu</p>
          <p className=" md:text-[50px] lg:text-[60px] font-[Noto Sans] font-bold">New class of casual Polo</p>
        </div>
        <div className="absolute top-[250px] left-[50%] text-white transform -translate-x-1/2">
          <p className=" md:text-[10px] lg:text-[20px] font-[Noto Sans] font-medium ">Polomanor định vị sự khác biệt đến từ những chiếc áo Polo đời thường hằng ngày, mỗi sản phẩm mang đủ 3 yếu tố:</p>
          <p className=" md:text-[10px] lg:text-[20px] font-[Noto Sans] font-medium mt-5 ">Dễ phối - Sang trọng - Tiện lợi</p>
        </div>


      </div>

      {/* một số hình ảnh */}

      <div className="flex ml-[120px]  space-x-10  mt-8 sm:mt-12">


        <div className="relative ">
          <img className="w-full transition-transform transform-gpu hover:scale-105 rounded-xl " src="/imgleft.png" alt="Image" />
          <p className="absolute top-[50%] text-center text-white text-[27px] font-medium ">Mỗi sản phẩm đến tay bạn là những chất xám và công sức của cả một tập thể phía sau</p>
        </div>
        <div>
          <div className="relative  flex space-x-6">
            <div>
              <img className=" h-[270px] w-full transition-transform hover:scale-105 rounded-xl" src="/center.jpg" alt="" />
            </div>
            <div>
              <img className=" h-[270px] w-full transition-transform  hover:scale-105 rounded-xl" src="/imgright.jpg" alt="" />
            </div>
          </div>
          <div>
            <img className=" h-[300px] w-full mt-[35px] transition-transform  hover:scale-105 rounded-xl" src="/bt.jpg" alt="" />
          </div>
        </div>
      </div>

    </div >


  )
}

export default HomePage