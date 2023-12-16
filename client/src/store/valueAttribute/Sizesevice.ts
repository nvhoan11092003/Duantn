import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Size } from '../productVariant/productVariant.interface'

export const sizeApi = createApi({
    reducerPath: 'sizeApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn-8bp3hnthd-nvhoan11092003.vercel.app/size'
    }),
    tagTypes: ['Size'],
    endpoints: (builder) => ({
        getsizeList: builder.query({
            query: () => ``,
            providesTags: ['Size']
        }),
        getSize: builder.query<Size, any>({
            query: (_id: string) => ({
                url: `/${_id}`,
                method: 'GET',
            }),
            providesTags: ['Size']
        }),
        editSize: builder.mutation<Size, Size>({
            query: (size) => ({
                url: `/${size._id}`,
                method: 'PUT',
                body: { size: size.size }
            }),
            invalidatesTags: ['Size']
        }),
        addSize: builder.mutation<Size[], Size>({

            query: (size) => ({
                url: ``,
                method: 'POST',
                body: { size: size.size }
            }),
            invalidatesTags: ['Size']
        }),
        deleteSize: builder.mutation<Size[], string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Size'],
        })
    }),


})

export const { useGetsizeListQuery, useAddSizeMutation, useDeleteSizeMutation, useEditSizeMutation, useGetSizeQuery } = sizeApi