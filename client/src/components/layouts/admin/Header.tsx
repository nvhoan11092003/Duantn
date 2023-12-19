
// import React from 'react'

type Props = {
  change: () => void
}



import { IoMail, IoCaretDownOutline, IoCaretUpOutline } from 'react-icons/io5'
import { FaCalendarAlt, FaBell } from 'react-icons/fa'



const Header = () => {

  return (
    <div className=''>
      <div className='flex justify-end max-w-full mt-8 mb-7 mx-6 h-10'>
        <div className='flex items-center ml-8'>
          <FaCalendarAlt className='text-gray-85 text-lg mx-2 hover:text-[#1D1F2C]  ' />
          <IoMail className='text-gray-85 text-lg mx-2 hover:text-[#1D1F2C] ' />
          <FaBell className='text-gray-85 text-lg mx-2 hover:text-[#1D1F2C] ' />
          <div className='flex items-center ml-6'>
            <div className='rounded-full w-8 h-8 overflow-hidden  bg-black-400 mr-3'>
              {/* <img src="https://www.roberthalf.com.au/sites/roberthalf.com.au/files/2019-05/admin_staff.jpg"  alt="" className='block h-full  object-cover' /> */}
            </div>
            <div className='mr-3'>
              <h3 className='text-sm font-medium text-[#07080B]'>Quản Trị Viên</h3>
              {/* <p className='text-xs font-medium text-black-400 leading-[18px]'>Manager</p> */}
            </div>
            <div className='flex items-center'><IoCaretDownOutline className='block text-lg  text-black-400  font-normal ml-2 hover:text-black-500' /></div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Header