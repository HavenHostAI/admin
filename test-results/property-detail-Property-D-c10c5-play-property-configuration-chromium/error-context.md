# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: Property Management
        - generic [ref=e8]: Manage hosting properties, servers, domains, and resources
      - button "Create Property" [ref=e9]:
        - img
        - text: Create Property
    - generic [ref=e10]:
      - generic [ref=e12]:
        - generic [ref=e14]:
          - img [ref=e15]
          - textbox "Search properties..." [ref=e18]
        - combobox [ref=e19]:
          - generic: Filter by type
          - img [ref=e20]
        - combobox [ref=e22]:
          - generic: Filter by status
          - img [ref=e23]
      - generic [ref=e25]: Loading properties...
  - generic [ref=e30] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e31] [cursor=pointer]:
      - img [ref=e32] [cursor=pointer]
    - generic [ref=e35] [cursor=pointer]:
      - button "Open issues overlay" [ref=e36] [cursor=pointer]:
        - generic [ref=e37] [cursor=pointer]:
          - generic [ref=e38] [cursor=pointer]: "2"
          - generic [ref=e39] [cursor=pointer]: "3"
        - generic [ref=e40] [cursor=pointer]:
          - text: Issue
          - generic [ref=e41] [cursor=pointer]: s
      - button "Collapse issues badge" [ref=e42] [cursor=pointer]:
        - img [ref=e43] [cursor=pointer]
  - alert [ref=e45]
```