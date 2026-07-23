import { prisma } from '#/db'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/candidates')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const jobId = url.searchParams.get('jobId')

        try {
          const where = jobId ? { jobId } : {}
          const candidates = await prisma.candidate.findMany({ where })

          return Response.json({
            success: true,
            data: candidates,
            message: 'Candidates fetched successfully.',
          })
        } catch (error: any) {
          return Response.json(
            {
              success: false,
              error: 'Internal server error fetching candidates.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
      POST: async ({ request }) => {
        const body = await request.json()

        try {
          const newCandidate = await prisma.candidate.create({
            data: {
              jobId: body.jobId,
              name: body.name,
              email: body.email,
              data: body.data,
            },
          })

          return Response.json({
            success: true,
            data: newCandidate,
            message: 'Candidate created successfully.',
          })
        } catch (error: any) {
          return Response.json(
            {
              success: false,
              error: 'Internal server error creating candidate.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
      DELETE: async ({ request }) => {
        const url = new URL(request.url)
        const id = url.searchParams.get('id')

        if (!id) {
          return Response.json(
            { success: false, message: 'Candidate ID is required.' },
            { status: 400 },
          )
        }

        try {
          await prisma.candidate.delete({ where: { id } })

          return Response.json({
            success: true,
            message: 'Candidate deleted successfully.',
          })
        } catch (error: any) {
          return Response.json(
            {
              success: false,
              error: 'Internal server error deleting candidate.',
              message: error.message,
            },
            { status: 400 },
          )
        }
      },
    },
  },
})
