import type { OpenAPIV3 } from "openapi-types";

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "English Dictionary API",
    description:
      "API RESTful para dicionário de inglês com autenticação JWT, histórico, favoritos e cache Redis. Proxy para [Free Dictionary API](https://dictionaryapi.dev/).",
    version: "1.0.0",
    contact: {
      name: "Jerry",
      url: "https://github.com/jerrones/monorepo-dictionary",
    },
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Desenvolvimento local",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT obtido via /auth/signup ou /auth/signin",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "Error message" },
        },
        required: ["message"],
      },
      AuthSignupRequest: {
        type: "object",
        properties: {
          name: { type: "string", example: "User 1", minLength: 2 },
          email: {
            type: "string",
            format: "email",
            example: "example@email.com",
          },
          password: { type: "string", example: "test", minLength: 4 },
        },
        required: ["name", "email", "password"],
      },
      AuthSigninRequest: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "example@email.com",
          },
          password: { type: "string", example: "test" },
        },
        required: ["email", "password"],
      },
      AuthResponse: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "f3a106sa-65dv-53ab-2c13-80acef000000",
          },
          name: { type: "string", example: "User 1" },
          token: { type: "string", example: "Bearer JWT.Token" },
        },
        required: ["id", "name", "token"],
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "User 1" },
          email: {
            type: "string",
            format: "email",
            example: "example@email.com",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2024-05-05T19:28:13.531Z",
          },
        },
        required: ["id", "name", "email", "createdAt"],
      },
      PaginatedWords: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: { type: "string" },
            example: ["fire", "firefly", "fireplace", "fireman"],
          },
          totalDocs: { type: "integer", example: 20 },
          previous: {
            type: "string",
            nullable: true,
            example: "eyIkb2lkIjoiNTgwZmQxNmjJkOGI5In0",
          },
          next: {
            type: "string",
            nullable: true,
            example: "eyIkb2lkIjoiNTgwZmQxNm1NjJkOGI4In0",
          },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: false },
        },
        required: [
          "results",
          "totalDocs",
          "previous",
          "next",
          "hasNext",
          "hasPrev",
        ],
      },
      WordHistoryItem: {
        type: "object",
        properties: {
          word: { type: "string", example: "fire" },
          added: {
            type: "string",
            format: "date-time",
            example: "2024-05-05T19:28:13.531Z",
          },
        },
        required: ["word", "added"],
      },
      PaginatedHistory: {
        type: "object",
        properties: {
          results: {
            type: "array",
            items: { $ref: "#/components/schemas/WordHistoryItem" },
          },
          totalDocs: { type: "integer", example: 20 },
          previous: { type: "string", nullable: true },
          next: { type: "string", nullable: true },
          hasNext: { type: "boolean", example: true },
          hasPrev: { type: "boolean", example: true },
        },
        required: [
          "results",
          "totalDocs",
          "previous",
          "next",
          "hasNext",
          "hasPrev",
        ],
      },
      DictionaryEntry: {
        type: "object",
        description:
          "Resposta completa da Free Dictionary API para uma palavra",
        properties: {
          word: { type: "string", example: "hello" },
          phonetic: { type: "string", example: "/həˈloʊ/" },
          phonetics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                text: { type: "string" },
                audio: { type: "string", format: "uri" },
                sourceUrl: { type: "string", format: "uri" },
              },
            },
          },
          meanings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                partOfSpeech: { type: "string", example: "noun" },
                definitions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      definition: { type: "string" },
                      synonyms: {
                        type: "array",
                        items: { type: "string" },
                      },
                      antonyms: {
                        type: "array",
                        items: { type: "string" },
                      },
                      example: { type: "string" },
                    },
                    required: ["definition"],
                  },
                },
                synonyms: {
                  type: "array",
                  items: { type: "string" },
                },
                antonyms: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["partOfSpeech", "definitions"],
            },
          },
          license: {
            type: "object",
            properties: {
              name: { type: "string" },
              url: { type: "string", format: "uri" },
            },
          },
          sourceUrls: {
            type: "array",
            items: { type: "string", format: "uri" },
          },
        },
        required: ["word"],
      },
    },
  },
  paths: {
    "/": {
      get: {
        tags: ["General"],
        summary: "Root",
        description: 'Retorna a mensagem "English Dictionary"',
        responses: {
          "200": {
            description: "Mensagem de boas-vindas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "English Dictionary",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/health": {
      get: {
        tags: ["General"],
        summary: "Health Check",
        responses: {
          "200": {
            description: "Status da API",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: {
                      type: "string",
                      format: "date-time",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Criar conta",
        description: "Registra um novo usuário e retorna token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSignupRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Usuário criado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Erro de validação ou email já cadastrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/auth/signin": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description: "Autentica usuário e retorna token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AuthSigninRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login realizado com sucesso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Email ou senha inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/entries/en": {
      get: {
        tags: ["Entries"],
        summary: "Listar palavras",
        description:
          "Retorna lista paginada de palavras do dicionário com suporte a busca",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "search",
            in: "query",
            description: "Filtro de busca por prefixo",
            schema: { type: "string", example: "fire" },
          },
          {
            name: "limit",
            in: "query",
            description: "Quantidade de resultados por página",
            schema: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
          {
            name: "cursor",
            in: "query",
            description: "Cursor para paginação (base64)",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Lista paginada de palavras",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedWords" },
              },
            },
          },
          "401": {
            description: "Token não fornecido ou inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/entries/en/{word}": {
      get: {
        tags: ["Entries"],
        summary: "Detalhes de uma palavra",
        description:
          "Retorna informações da palavra via proxy da Dictionary API e registra no histórico. Respostas são cacheadas no Redis.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "word",
            in: "path",
            required: true,
            description: "Palavra a ser buscada",
            schema: { type: "string", example: "hello" },
          },
        ],
        responses: {
          "200": {
            description: "Detalhes da palavra",
            headers: {
              "x-cache": {
                description: "HIT (cache) ou MISS (API externa)",
                schema: { type: "string", enum: ["HIT", "MISS"] },
              },
              "x-response-time": {
                description: "Tempo de resposta em ms",
                schema: { type: "string", example: "42ms" },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/DictionaryEntry",
                  },
                },
              },
            },
          },
          "404": {
            description: "Palavra não encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/entries/en/{word}/favorite": {
      post: {
        tags: ["Favorites"],
        summary: "Favoritar palavra",
        description:
          "Adiciona palavra à lista de favoritos. Persistência é assíncrona via Redis Pub/Sub.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "word",
            in: "path",
            required: true,
            schema: { type: "string", example: "hello" },
          },
        ],
        responses: {
          "202": {
            description: "Solicitação de favorito aceita (processamento assíncrono)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Solicitação de favorito recebida" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/entries/en/{word}/unfavorite": {
      delete: {
        tags: ["Favorites"],
        summary: "Desfavoritar palavra",
        description:
          "Remove palavra da lista de favoritos. Persistência é assíncrona via Redis Pub/Sub.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "word",
            in: "path",
            required: true,
            schema: { type: "string", example: "hello" },
          },
        ],
        responses: {
          "202": {
            description: "Solicitação de remoção aceita (processamento assíncrono)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Solicitação de remoção recebida" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/user/me": {
      get: {
        tags: ["User"],
        summary: "Perfil do usuário",
        description: "Retorna os dados do usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Perfil do usuário",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserProfile" },
              },
            },
          },
          "401": {
            description: "Token inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/user/me/history": {
      get: {
        tags: ["User"],
        summary: "Histórico de palavras",
        description:
          "Retorna lista paginada de palavras visitadas pelo usuário",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Histórico paginado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedHistory" },
              },
            },
          },
        },
      },
    },
    "/user/me/favorites": {
      get: {
        tags: ["User"],
        summary: "Palavras favoritas",
        description:
          "Retorna lista paginada de palavras marcadas como favoritas",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: {
              type: "integer",
              default: 20,
              minimum: 1,
              maximum: 100,
            },
          },
          {
            name: "cursor",
            in: "query",
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Favoritos paginados",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedHistory" },
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: "General", description: "Endpoints gerais" },
    { name: "Auth", description: "Autenticação e registro" },
    { name: "Entries", description: "Palavras do dicionário" },
    { name: "Favorites", description: "Gerenciamento de favoritos" },
    { name: "User", description: "Perfil, histórico e favoritos do usuário" },
  ],
};
