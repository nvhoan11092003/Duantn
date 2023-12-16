import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { IVoucher } from './voucher.interface'


export const voucherApi = createApi({
    reducerPath: 'voucherApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn-8bp3hnthd-nvhoan11092003.vercel.app/voucher'
    }),
    tagTypes: ['Voucher'],
    endpoints: (builder) => ({
        getVoucherList: builder.query({
            query: () => ``,
            providesTags: ['Voucher']
        }),
        getVoucher: builder.query({
            query: (id: string) => ({
                url: `/${id}`,
                method: 'GET',
            }),
            providesTags: ['Voucher']
        }),
        addVoucher: builder.mutation<IVoucher[], IVoucher>({
            query: (voucher) => ({
                url: `/createVoucher`,
                method: 'POST',
                body: voucher
            }),
            invalidatesTags: ['Voucher']
        }),
        editVoucher: builder.mutation<IVoucher[], IVoucher>({
            query: (voucher) => ({
                url: `/${voucher._id}`,
                method: 'PUT',
                body: voucher
            }),
            invalidatesTags: ['Voucher']
        }),
        deleteVoucher: builder.mutation<IVoucher[], string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Voucher'],
        })
    })
})

export const { useGetVoucherListQuery, useGetVoucherQuery, useAddVoucherMutation, useDeleteVoucherMutation, useEditVoucherMutation } = voucherApi