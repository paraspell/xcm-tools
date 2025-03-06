import {
  Button,
  Code,
  Grid,
  Paper,
  rem,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBrandJavascript,
  IconBrandPython,
  IconBrandRust,
} from "@tabler/icons-react";

import classes from "./Learn.module.css";

const NODE_JS_CODE = `// Define API URL
const API_URL = 'https://api.lightspell.xyz'

// Make a HTTP GET request
const response = await fetch(\`\${API_URL}/assets/Acala\`)

// Use response data as necessary
console.log(response)
`;

const PYTHON_CODE = `import requests

# Define API URL
API_URL = 'https://api.lightspell.xyz'

# Make a HTTP GET request
response = requests.get(f'{API_URL}/assets/Acala')

# Use response data as necessary
print(response.json())
`;

const RUST_CODE = `import requests

let api_url = "https://api.lightspell.xyz";

// Make a HTTP GET request
let res = reqwest::get(format!("{}/assets/Acala", api_url)).await?;

// Use response data as necessary
let body = res.text().await?;
println!("Response: {:?}", body);
`;

export function Learn() {
  const iconStyle = { width: rem(12), height: rem(12) };

  const isSmallScreen = useMediaQuery("(max-width: 768px)");

  return (
    <div className={classes.wrapper} id="learn">
      <Grid gutter={isSmallScreen ? 45 : 80}>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Title className={classes.title} order={2}>
            Making API Requests
          </Title>
          <Text c="dimmed">
            Jumpstart your journey into API integration with a quick-start
            approach to firing off API requests. Utilize tools such as curl,
            Node.js, or Python to effortlessly communicate with our API.
          </Text>

          <Button
            component="a"
            href="https://paraspell.github.io/docs/api/g-started.html"
            size="lg"
            radius="md"
            mt="xl"
          >
            View docs
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper
            h="100%"
            shadow="md"
            withBorder
            radius="lg"
            style={{ overflow: "hidden" }}
          >
            <Tabs defaultValue="nodejs" h="100%">
              <Tabs.List>
                <Tabs.Tab
                  value="nodejs"
                  leftSection={<IconBrandJavascript style={iconStyle} />}
                >
                  Node.js
                </Tabs.Tab>
                <Tabs.Tab
                  value="python"
                  leftSection={<IconBrandPython style={iconStyle} />}
                >
                  Python
                </Tabs.Tab>
                <Tabs.Tab
                  value="rust"
                  leftSection={<IconBrandRust style={iconStyle} />}
                >
                  Rust
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="nodejs" style={{ height: "100%" }}>
                <Code block mih={200} h="100%" fz="sm" p="md">
                  {NODE_JS_CODE}
                </Code>
              </Tabs.Panel>

              <Tabs.Panel value="python" style={{ height: "100%" }}>
                <Code block mih={200} h="100%" fz="sm" p="md">
                  {PYTHON_CODE}
                </Code>
              </Tabs.Panel>

              <Tabs.Panel value="rust" style={{ height: "100%" }}>
                <Code block mih={200} h="100%" fz="sm" p="md">
                  {RUST_CODE}
                </Code>
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}
