/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react');

const CompLibrary = require('../../core/CompLibrary.js');

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const {siteConfig, language = ''} = this.props;
    const {baseUrl, docsUrl} = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ''}`;
    const langPart = `${language ? `${language}/` : ''}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const Logo = props => (
      <div className="projectLogo">
        <img src={props.img_src} alt="Project Logo" />
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        {siteConfig.title}
        <small>{siteConfig.tagline}</small>
      </h2>
    );

    const PromoSection = props => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = props => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <Logo img_src={`${baseUrl}img/docusaurus.svg`} />
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig} />
          <PromoSection>
            {/* <Button href="#try">Try It Out</Button> */}
            <Button href={docUrl('getting-started-js.html')}>
              Getting Started (JavaScript)
            </Button>
            <Button href={docUrl('getting-started-ts.html')}>
              Getting Started (TypeScript)
            </Button>
            {/* <Button href={docUrl('js-schema.html')}>
              JavaScript API Reference
            </Button> */}
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

class Index extends React.Component {
  render() {
    const {config: siteConfig, language = ''} = this.props;
    const {baseUrl} = siteConfig;

    const Block = props => (
      <Container
        padding={['bottom', 'top']}
        id={props.id}
        background={props.background}
      >
        <GridBlock
          align="center"
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const FeatureCallout = () => (
      <div
        className="productShowcaseSection paddingBottom"
        style={{textAlign: 'center'}}
      >
        <h2>Automatic Mutations</h2>
        <MarkdownBlock>
          There is no need to manually specify how your cache should be updated
          after a mutation. Bicycle tracks what data is on your client, so that
          it can simply re-run the query to find out waht changed.
        </MarkdownBlock>
      </div>
    );

    const RequestWhatYouNeed = ({id, background}) => (
      <Block id={id} background={background}>
        {[
          {
            content:
              "Bicycle lets you query exactly what you need, and even combine multiple partial queries. Because you can specify what data you require along with the components that require that data, it's easy to avoid fetching data you don't need. Using TypeScript, you can further improve the refactoring experience, by ensuring you get immediate type errors if you remove a field that a component depended on.",
            image: `${baseUrl}img/docusaurus.svg`,
            imageAlign: 'right',
            title: 'Request What You Need',
          },
        ]}
      </Block>
    );

    const CombineBackendServices = ({id, background}) => (
      <Block id={id} background={background}>
        {[
          {
            content:
              "Bicycle is not tied to any one database or storage system. In fact, you can use one Bicycle Schema to combine search results from elastic search, SQL queries from Postgres, images from Amazon S3, and anything else you can think of. Because of Bicycle's tree structure for querying data, you can do all this with only a single round trip from the client to the server, making Bicycle a great fit for mobile web apps.",
            image: `${baseUrl}img/docusaurus.svg`,
            imageAlign: 'left',
            title: 'Bring Your Own Database',
          },
        ]}
      </Block>
    );

    const StronglyTyped = ({id, background}) => (
      <Block id={id} background={background}>
        {[
          {
            content:
              "Bicycle supports TypeScript all the way from defining your schema, to querying it on the client. When we say we support TypeScript, we don't just mean our API has a `.d.ts` definition file, we mean you can rely on TypeScript to know what type the data returned from query has, and what type the arguments to a mutation need to be.",
            image: `${baseUrl}img/typescript.svg`,
            imageAlign: 'right',
            title: 'Strongly Typed',
          },
        ]}
      </Block>
    );

    const Features = () => (
      <Block layout="fourColumn">
        {[
          {
            content:
              'Bicycle only expose data you explicitly include in your schema, and validates all requests.',
            image: `${baseUrl}img/docusaurus.svg`,
            imageAlign: 'top',
            title: 'Secure',
          },
          {
            content:
              "Bicycle offers a TypeScript API that's genuinely strongly typed, from server to client.",
            image: `${baseUrl}img/typescript.svg`,
            imageAlign: 'top',
            title: 'Strongly Typed',
          },
          {
            content:
              'Bicycle figures out what changed for you, making mutating data a breeze',
            image: `${baseUrl}img/docusaurus.svg`,
            imageAlign: 'top',
            title: 'Easy To Use',
          },
        ]}
      </Block>
    );

    const Showcase = () => {
      if ((siteConfig.users || []).length === 0) {
        return null;
      }

      const showcase = siteConfig.users
        .filter(user => user.pinned)
        .map(user => (
          <a href={user.infoLink} key={user.infoLink}>
            <img src={user.image} alt={user.caption} title={user.caption} />
          </a>
        ));

      const pageUrl = page => baseUrl + (language ? `${language}/` : '') + page;

      return (
        <div className="productShowcaseSection paddingBottom">
          <h2>Who is Using This?</h2>
          <p>This project is used by all these people</p>
          <div className="logos">{showcase}</div>
          {showcase.length === siteConfig.users.length ? null : (
            <div className="more-users">
              <a className="button" href={pageUrl('users.html')}>
                More {siteConfig.title} Users
              </a>
            </div>
          )}
        </div>
      );
    };

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language} />
        <div className="mainContainer">
          <Features />
          <FeatureCallout />
          <CombineBackendServices background="light" />
          <StronglyTyped />
          <RequestWhatYouNeed background="dark" />
          <Showcase />
        </div>
      </div>
    );
  }
}

module.exports = Index;
