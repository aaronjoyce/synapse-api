import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
} from "@cloudflare/itty-router-openapi";
import { NamespaceBody, Namespace, VectorIndexConfigOverride } from "../types";
import { Env } from '../env';
import {
	StatusCodes,
 } from 'http-status-codes';


export class NamespaceCreate extends OpenAPIRoute {
	static schema: OpenAPIRouteSchema = {
		tags: ["Namespaces"],
		summary: "Create a namespace",
		requestBody: NamespaceBody,
		responses: {
			"200": {
				description: "Returns the created namespace",
				schema: {
					success: Boolean,
					result: {
						namespace: Namespace,
					},
				},
			},
		},
	};

	async createNamespace(namespace: string, model: string, env: Env) {
		const embeddingsInsertSql = `INSERT INTO namespaces (name, model) VALUES (?, ?) RETURNING *;`; 
		const { results } = await env.DB.prepare(
			embeddingsInsertSql
		).bind(namespace, model).all();
		return results;
	};

	async handle(
		request: Request,
		env: Env,
		context: any,
		data: Record<string, any>
	) {
		const namespaceToCreate = data.body; 
		const { results: existingNamespaceResults } = await env.DB.prepare(
			"SELECT * FROM namespaces WHERE name = ?;"
		).bind(namespaceToCreate.name).all();
		if (existingNamespaceResults.length === 1) {
			return Response.json({ error: `Namespace with name ${namespaceToCreate.name} already exists`}, {
				status: StatusCodes.BAD_REQUEST
			});
		} 

        let namespaceResults = await this.createNamespace(
            namespaceToCreate.name,
            namespaceToCreate.model,
            env
        );
        if (namespaceResults.length === 0) {
            return Response.json({ 
                error: `Failed to create a Cloudflare namespace in your D1 database` 
            }, {
                status: StatusCodes.BAD_REQUEST
            });
        }
        const namespaceData = namespaceResults[0];
		const vectorIndexResult = await env.VECTORIZE_INDEX.describe();
		const vectorIndexConfig = vectorIndexResult.config as VectorIndexConfigOverride;
        return {
            success: true,
            namespace: {
                id: namespaceData.id,
                name: namespaceData.name,
                description: vectorIndexResult.description,
                dimensionality: vectorIndexConfig.dimensions,
                distance: vectorIndexConfig.metric,
                indexName: vectorIndexResult.name,
                model: namespaceData.model
            },
        };
	}
}