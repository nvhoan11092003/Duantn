import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
// import { IProductVariant } from '../productVariant/productVariant.interface'

export const productDiscountApi = createApi({
    reducerPath: 'productDiscountApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn.vercel.app//productDiscount'
    }),
    tagTypes: ['productDiscount'],
    endpoints: (builder) => ({
        getproductDiscountApi: builder.query({
            query: () => ``,
            providesTags: ['productDiscount']
        }),
        getproductDiscountApiSold: builder.query({
            query: () => ({
                url: `sold`,
                method: 'GET',
            }),
            providesTags: ['productDiscount']
        }),
        getproductSold: builder.query({
            query: ({ lowerBound, upperBound }) => {
                const body = { lowerBound, upperBound }
                return {
                    url: `products-by-sales-range`,
                    method: 'GET',
                    body: body
                }
            },
            providesTags: ['productDiscount']
        }),

    })

})

export const { useGetproductDiscountApiQuery, useGetproductSoldQuery, useGetproductDiscountApiSoldQuery } = productDiscountApi



