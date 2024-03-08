import { Title, Accordion, Anchor } from "@mantine/core";
import classes from "./Faq.module.css";

export function Faq() {
  return (
    <div className={classes.wrapper}>
      <Title ta="left" className={classes.title}>
        Frequently Asked Questions
      </Title>

      <Accordion variant="separated">
        <Accordion.Item className={classes.item} value="what-is-xcm-api">
          <Accordion.Control>
            What is XCM API and how does it work?
          </Accordion.Control>
          <Accordion.Panel>
            XCM API is a RESTful service designed to facilitate cross-chain
            communication and asset transfers across the Polkadot and Kusama
            ecosystems. It enables developers to interact with various
            blockchain protocols directly over HTTP, making it easier to build
            and scale decentralized applications.
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="start-using-xcm-api">
          <Accordion.Control>
            How can I start using XCM API in my project?
          </Accordion.Control>
          <Accordion.Panel>
            To use XCM API, simply make HTTP requests from your application to
            our API endpoints. There's no need to install any dependencies.
            Check our documentation for detailed API endpoints, request formats,
            and example code to help you get started.
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="api-costs">
          <Accordion.Control>
            Are there any costs associated with using the XCM API?
          </Accordion.Control>
          <Accordion.Panel>
            The XCM API is entirely free to use, offering developers a generous
            way to integrate and test their applications without any cost.
            However, it's important to note that while the API itself does not
            incur charges, there are rate limits to consider. Without an API
            key, users are limited to 20 requests per minute. By generating an
            API key, this limit increases to 100 requests per minute,
            facilitating the development and scaling of applications. To obtain
            an API key, you can{" "}
            <Anchor
              href="https://api.lightspell.xyz/app/generate-api-key/"
              target="_blank"
            >
              generate an API key here
            </Anchor>
            . Additionally, for applications that require higher request
            volumes, you can{" "}
            <Anchor
              href="https://api.lightspell.xyz/app/higher-request-limit/"
              target="_blank"
            >
              request a higher limit here
            </Anchor>
            . For those who choose to deploy the XCM API instance themselves,
            the predefined rate limits do not apply, offering more flexibility
            for application development. Regardless of deployment, transaction
            fees related to blockchain operations may still apply and vary by
            network. This makes the XCM API a cost-effective option for both
            development and production environments, especially when managing
            resources and application scaling strategically.
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item className={classes.item} value="developer-support">
          <Accordion.Control>
            What kind of support does XCM API offer for developers?
          </Accordion.Control>
          <Accordion.Panel>
            We offer extensive documentation to help you integrate XCM API into
            your projects, including API references, example requests, and best
            practices. For additional support, reach out to our community on
            forums or issue trackers where our team and other developers can
            assist you.
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}
