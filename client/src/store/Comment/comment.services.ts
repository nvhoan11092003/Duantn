import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Comment } from './comment.interface'

export const commentApi = createApi({
    reducerPath: 'commentApi',
    baseQuery: fetchBaseQuery({
        baseUrl: 'https://databasedatn.vercel.app'
    }),
    tagTypes: ['Comment'],
    endpoints: (builder) => ({
        getCommentList: builder.query({
            query: () => ``,
            providesTags: ['Comment']
        }),
        getComment: builder.query({
            query: (id: string) => ({
                url: `/${id}`,
                method: 'GET',
            }),
            providesTags: ['Comment']
        }),
        getCommentbyidprouct: builder.query({
            query: (id: string) => ({
                url: `/byidproduct/${id}`,
                method: 'GET',
            }),
            providesTags: ['Comment']
        }),
        addComment: builder.mutation<Comment[], Comment>({
            query: (data: { Product: string, name: string | null, comment: string | null, email: string | null, feedback: number | null }) => ({
                url: ``,
                method: 'POST',
                body: data
            }),
            invalidatesTags: ['Comment']
        }),
        editComment: builder.mutation<Comment[], Comment>({
            query: (comment) => ({
                url: `/${comment._id}`,
                method: 'PATCH',
                body: comment
            }),
            invalidatesTags: ['Comment']
        }),
        deleteComment: builder.mutation<Comment[], string>({
            query: (id) => ({
                url: `/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Comment'],
        })
    })

})

export const { useGetCommentbyidprouctQuery, useAddCommentMutation, useDeleteCommentMutation, useEditCommentMutation, useGetCommentListQuery, useGetCommentQuery } = commentApi
export const authReducer = commentApi.reducer
export default commentApi