import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: process.env.VITE_API_URL,
  documents: ["./src/**/*.{ts,tsx}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/gql/": {
      preset: "client",
      plugins: [],
      config: {
        namingConvention: {
          enumValues: "keep",
        },
      },
    },
  },
};

export default config;
