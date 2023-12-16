import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const orderApi = createApi({
    reducerPath: 'orderApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn-8bp3hnthd-nvhoan11092003.vercel.app/products'
    }),
    tagTypes: ['Order'],
    endpoints: (builder) => ({

        totalOrderaday: builder.mutation({
            query: ({ startDate, endDate }) => {
                const body = { startDate, endDate }
                return {
                    url: `totalOrderaday`,
                    method: 'POST',
                    body: body
                }
            },
            invalidatesTags: ['Order']
        }),
        totalOrderamonth: builder.mutation({
            query: ({ startYear, endYear }) => {
                const body = { startYear, endYear }
                return {
                    url: `totalOrderamonth`,
                    method: 'POST',
                    body: body
                }
            },
            invalidatesTags: ['Order']
        }),
        totalproductamonth: builder.mutation({
            query: ({ startYear, endYear }) => {
                const body = { startYear, endYear }
                return {
                    url: `productsmonthSold`,
                    method: 'POST',
                    body: body
                }
            },
            invalidatesTags: ['Order']
        }),
        totalProductaday: builder.mutation({
            query: ({ startDate, endDate }) => {
                const body = { startDate, endDate }
                return {
                    url: `productsSold`,
                    method: 'POST',
                    body: body
                }
            },
            invalidatesTags: ['Order']
        }),

    })

})

export const { useTotalOrderadayMutation, useTotalProductadayMutation, useTotalproductamonthMutation, useTotalOrderamonthMutation } = orderApi