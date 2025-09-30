import {
  ReactNode,
  useEffect,
  useState,
  isValidElement,
  Children,
} from "react";
import {
  ShowBase,
  InferredElement,
  getElementsFromRecords,
  useResourceContext,
  useShowContext,
  InferredTypeMap,
} from "ra-core";
import { capitalize, singularize } from "inflection";
import { ShowView } from "@/components/admin/show";
import { RecordField } from "@/components/admin/record-field";
import { DateField } from "./date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { NumberField } from "@/components/admin/number-field";
import { ArrayField } from "@/components/admin/array-field";
import { BadgeField } from "@/components/admin/badge-field";
import { SingleFieldList } from "@/components/admin/single-field-list";
import { ReferenceArrayField } from "@/components/admin/reference-array-field";

export const ShowGuesser = (props: { enableLog?: boolean }) => (
  <ShowBase>
    <ShowViewGuesser {...props} />
  </ShowBase>
);

const getStringProp = (props: Record<string, unknown>, key: string) => {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
};

const isTruthy = (value: unknown): boolean => Boolean(value);

const ShowViewGuesser = (props: { enableLog?: boolean }) => {
  const resource = useResourceContext();

  if (!resource) {
    throw new Error(`Cannot use <ShowGuesser> outside of a ResourceContext`);
  }

  const { record } = useShowContext();
  const [child, setChild] = useState<ReactNode>(null);
  const { enableLog = process.env.NODE_ENV === "development", ...rest } = props;

  useEffect(() => {
    setChild(null);
  }, [resource]);

  useEffect(() => {
    if (record && !child) {
      const inferredElements = getElementsFromRecords([record], showFieldTypes);
      const inferredChild = new InferredElement(
        showFieldTypes.show,
        null,
        inferredElements
      );
      setChild(inferredChild.getElement());

      if (!enableLog) return;

      const representation = inferredChild.getRepresentation();
      const components = ["Show"]
        .concat(
          Array.from(
            new Set(
              Array.from(representation.matchAll(/<([^/\s>]+)/g))
                .map((match) => match[1])
                .filter(
                  (component) => component !== "span" && component !== "div"
                )
            )
          )
        )
        .sort();

      console.log(
        `Guessed Show:

${components
  .map(
    (component) =>
      `import { ${component} } from "@/components/admin/${kebabCase(
        component
      )}";`
  )
  .join("\n")}

export const ${capitalize(singularize(resource))}Show = () => (
    <Show>
${inferredChild.getRepresentation()}
    </Show>
);`
      );
    }
  }, [record, child, resource, enableLog]);

  return <ShowView {...rest}>{child}</ShowView>;
};

const showFieldTypes: InferredTypeMap = {
  show: {
    component: (props: Record<string, unknown>) => {
      const children = props.children as ReactNode;
      return <div className="flex flex-col gap-4">{children}</div>;
    },
    representation: (
      _props: Record<string, unknown>,
      children: { getRepresentation: () => string }[]
    ) => `        <div className="flex flex-col gap-4">
${children
  .map((child) => `            ${child.getRepresentation()}`)
  .join("\n")}
        </div>`,
  },
  reference: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      const reference = getStringProp(props, "reference");
      if (!source || !reference) {
        return null;
      }
      return (
        <RecordField source={source}>
          <ReferenceField source={source} reference={reference} />
        </RecordField>
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      const reference = getStringProp(props, "reference") ?? "";
      return `<RecordField source="${source}">
                <ReferenceField source="${source}" reference="${reference}" />
            </RecordField>`;
    },
  },
  array: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      const childrenNodes = props.children as ReactNode;
      const childrenArray = Children.toArray(childrenNodes);
      return (
        <RecordField source={source}>
          <ArrayField source={source}>
            <SingleFieldList>
              {childrenArray.length > 0 &&
              isValidElement(childrenArray[0]) &&
              typeof (childrenArray[0].props as Record<string, unknown>).source ===
                "string" ? (
                <BadgeField
                  source={
                    (childrenArray[0].props as Record<string, unknown>)
                      .source as string
                  }
                />
              ) : null}
            </SingleFieldList>
          </ArrayField>
        </RecordField>
      );
    },
    representation: (props: Record<string, unknown>, children: unknown[]) => {
      const source = getStringProp(props, "source") ?? "";
      const badgeSource = (() => {
        if (children.length === 0) {
          return "";
        }
        const firstChild = children[0];
        if (
          firstChild &&
          typeof firstChild === "object" &&
          firstChild !== null &&
          "getProps" in firstChild &&
          typeof (firstChild as { getProps?: unknown }).getProps === "function"
        ) {
          const childProps = (firstChild as {
            getProps: () => Record<string, unknown>;
          }).getProps();
          return getStringProp(childProps, "source") ?? "";
        }
        return "";
      })();
      return `<RecordField source="${source}">
                <ArrayField source="${source}">
                    <SingleFieldList>
                        <BadgeField source="${badgeSource}" />
                    </SingleFieldList>
                </ArrayField>
            </RecordField>`;
    },
  },
  referenceArray: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      const reference = getStringProp(props, "reference");
      if (!source || !reference) {
        return null;
      }
      const {
        children,
        source: _unusedSource,
        reference: _unusedReference,
        ...rest
      } = props as {
        children?: ReactNode;
        source?: unknown;
        reference?: unknown;
      };
      return (
        <RecordField source={source}>
          <ReferenceArrayField
            {...(rest as Record<string, unknown>)}
            source={source}
            reference={reference}
          >
            {children as ReactNode}
          </ReferenceArrayField>
        </RecordField>
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      const reference = getStringProp(props, "reference") ?? "";
      return `<RecordField source="${source}">
                <ReferenceArrayField source="${source}" reference="${reference}" />
            </RecordField>`;
    },
  },
  boolean: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      return (
        <RecordField
          source={source}
          render={(record: Record<string, unknown>) => {
            const key = source as keyof typeof record;
            return isTruthy(record[key]) ? "Yes" : "No";
          }}
        />
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      return `<RecordField source="${source}" render={record => record[${source}] ? 'Yes' : 'No'} />`;
    },
  },
  date: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      return (
        <RecordField source={source}>
          <DateField source={source} />
        </RecordField>
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      return `<RecordField source="${source}">
                <DateField source="${source}" />
            </RecordField>`;
    },
  },
  number: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      return (
        <RecordField source={source}>
          <NumberField source={source} />
        </RecordField>
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      return `<RecordField source="${source}">
                <NumberField source="${source}" />
            </RecordField>`;
    },
  },
  string: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      return <RecordField source={source} />;
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      return `<RecordField source="${source}" />`;
    },
  },
};

const kebabCase = (name: string) => {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
};
