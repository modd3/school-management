import { baseApi } from './baseApi';
import { ApiResponse } from '@/types';

interface ClassSubject {
  _id: string;
  class: {
    _id: string;
    name: string;
    grade: number;
  };
  subject: {
    _id: string;
    name: string;
    code: string;
    category: string;
  };
  teacher: string;
  academicYear: string;
  termNumber: number;
  maxMarks: {
    cat1: number;
    cat2: number;
    endterm: number;
  };
  status: string;
}

interface ClassSubjectStudent {
  _id: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  admissionNumber: string;
  currentClass?: {
    _id: string;
    name: string;
  };
}

export const classSubjectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    
    // Get teacher's assigned class subjects
    getMyClassSubjects: builder.query<
      ApiResponse<{ classSubjects: ClassSubject[]; count: number }>,
      { academicYear?: string; termNumber?: number }
    >({
      query: (params) => ({
        url: '/class-subjects/me',
        params,
      }),
      providesTags: ['ClassSubject'],
    }),
    
    // Get students enrolled in a specific class-subject
    getStudentsInClassSubject: builder.query<
      ApiResponse<{ students: ClassSubjectStudent[]; count: number }>,
      { classSubjectId: string; academicYear: string }
    >({
      query: ({ classSubjectId, academicYear }) => ({
        url: `/class-subjects/${classSubjectId}/students`,
        params: { academicYear },
      }),
      providesTags: (result, error, { classSubjectId }) => [
        { type: 'Student', id: classSubjectId }
      ],
    }),
    
  }),
  overrideExisting: false,
});

export const {
  useGetMyClassSubjectsQuery,
  useGetStudentsInClassSubjectQuery,
} = classSubjectsApi;
