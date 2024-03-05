import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { TaskCreate } from "./endpoints/taskCreate";
import { TaskDelete } from "./endpoints/taskDelete";
import { TaskFetch } from "./endpoints/taskFetch";
import { TaskList } from "./endpoints/taskList";
import { NamespaceDescribe } from "./endpoints/namespaceDescribe";
import { VectorsList } from "./endpoints/vectorList";

export interface Env {
	VECTORIZE_INDEX: VectorizeIndex;
	OPENAI_API_KEY: String;
	DB: D1Database;
}

export interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

export const router = OpenAPIRouter({
	docs_url: "/",
});


router.get("/api/namespace", NamespaceDescribe);
router.get("/api/vectors", VectorsList);
router.get("/api/tasks/", TaskList);
router.post("/api/tasks/", TaskCreate);
router.get("/api/tasks/:taskSlug/", TaskFetch);
router.delete("/api/tasks/:taskSlug/", TaskDelete);

// 404 for everything else
router.all("*", () =>
	Response.json(
		{
			success: false,
			error: "Route not found",
		},
		{ status: 404 }
	)
);

export default {
	fetch: router.handle,
};
