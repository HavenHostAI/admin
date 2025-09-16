# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - heading "Create T3 App" [level=1] [ref=e4]:
        - text: Create
        - generic [ref=e5]: T3
        - text: App
      - generic [ref=e6]:
        - link "First Steps → Just the basics - Everything you need to know to set up your database and authentication." [ref=e7] [cursor=pointer]:
          - /url: https://create.t3.gg/en/usage/first-steps
          - heading "First Steps →" [level=3] [ref=e8] [cursor=pointer]
          - generic [ref=e9] [cursor=pointer]: Just the basics - Everything you need to know to set up your database and authentication.
        - link "Documentation → Learn more about Create T3 App, the libraries it uses, and how to deploy it." [ref=e10] [cursor=pointer]:
          - /url: https://create.t3.gg/en/introduction
          - heading "Documentation →" [level=3] [ref=e11] [cursor=pointer]
          - generic [ref=e12] [cursor=pointer]: Learn more about Create T3 App, the libraries it uses, and how to deploy it.
      - generic [ref=e13]:
        - paragraph [ref=e14]: Hello from tRPC
        - generic [ref=e15]:
          - paragraph
          - link "Sign in" [ref=e16] [cursor=pointer]:
            - /url: /api/auth/signin
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23] [cursor=pointer]
  - alert [ref=e26]
```