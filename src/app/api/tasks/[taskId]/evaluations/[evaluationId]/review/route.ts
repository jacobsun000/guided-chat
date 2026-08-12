import { ZodError } from "zod"

import { verifyAccessToken } from "@/agent/auth"
import { getTaskById } from "@/lib/tasks"
import {
  getEvaluationReview,
  saveEvaluationReview,
} from "@/lib/evaluation-reviews"
import { getTaskEvaluations } from "@/lib/task-results"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ taskId: string; evaluationId: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { taskId, evaluationId } = await params
  const evaluations = await getTaskEvaluations(taskId)
  if (!getTaskById(taskId) || !evaluations.some(({ id }) => id === evaluationId)) {
    return Response.json({ error: "Evaluation not found." }, { status: 404 })
  }

  return Response.json(await getEvaluationReview(taskId, evaluationId))
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { taskId, evaluationId } = await params
  const evaluations = await getTaskEvaluations(taskId)
  if (!getTaskById(taskId) || !evaluations.some(({ id }) => id === evaluationId)) {
    return Response.json({ error: "Evaluation not found." }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    )
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid review request." }, { status: 400 })
  }

  const { accessToken, review } = body as {
    accessToken?: unknown
    review?: unknown
  }
  const verification = verifyAccessToken(accessToken)
  if (verification === "not-configured") {
    return Response.json({ error: "Server access token is not configured." }, { status: 500 })
  }
  if (verification === "invalid") {
    return Response.json({ error: "Invalid access token." }, { status: 401 })
  }

  try {
    return Response.json(await saveEvaluationReview(taskId, evaluationId, review))
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Review does not match the evaluation schema.", issues: error.issues },
        { status: 400 }
      )
    }

    console.error("Unable to save evaluation review.", error)
    return Response.json({ error: "Unable to save review." }, { status: 500 })
  }
}
