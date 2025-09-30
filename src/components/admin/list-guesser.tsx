import * as React from "react";
import { useState, useEffect } from "react";
import {
  ListBase,
  getElementsFromRecords,
  InferredElement,
  useListContext,
  usePrevious,
  useResourceContext,
  RaRecord,
} from "ra-core";
import { useLocation } from "react-router";
import { ListProps, ListView, ListViewProps } from "@/components/admin/list";
import { capitalize, singularize } from "inflection";
import { DataTable } from "@/components/admin/data-table";
import { ArrayField } from "@/components/admin/array-field";
import { BadgeField } from "@/components/admin/badge-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { SingleFieldList } from "@/components/admin/single-field-list";
import { ReferenceArrayField } from "@/components/admin/reference-array-field";

export const ListGuesser = <RecordType extends RaRecord = RaRecord>(
  props: Omit<ListProps, "children"> & { enableLog?: boolean },
) => {
  const {
    debounce,
    disableAuthentication,
    disableSyncWithLocation,
    exporter,
    filter,
    filterDefaultValues,
    perPage,
    resource,
    sort,
    ...rest
  } = props;
  // force a rerender of this component when any list parameter changes
  // otherwise the ListBase won't be rerendered when the sort changes
  // and the following check won't be performed
  useLocation();
  // keep previous data, unless the resource changes
  const resourceFromContext = useResourceContext(props);
  const previousResource = usePrevious(resourceFromContext);
  const keepPreviousData = previousResource === resourceFromContext;
  return (
    <ListBase<RecordType>
      debounce={debounce}
      disableAuthentication={disableAuthentication}
      disableSyncWithLocation={disableSyncWithLocation}
      exporter={exporter}
      filter={filter}
      filterDefaultValues={filterDefaultValues}
      perPage={perPage}
      resource={resource}
      queryOptions={{
        placeholderData: (previousData) =>
          keepPreviousData ? previousData : undefined,
      }}
      sort={sort}
    >
      <ListViewGuesser {...rest} />
    </ListBase>
  );
};

const ListViewGuesser = (
  props: Omit<ListViewProps, "children"> & { enableLog?: boolean },
) => {
  const { data } = useListContext();
  const resource = useResourceContext();
  const [child, setChild] = useState<React.ReactElement | null>(null);
  const { enableLog = process.env.NODE_ENV === "development", ...rest } = props;

  useEffect(() => {
    setChild(null);
  }, [resource]);

  useEffect(() => {
    if (data && data.length > 0 && !child) {
      const inferredElements = getElementsFromRecords(data, listFieldTypes);
      const inferredChild = new InferredElement(
        listFieldTypes.table,
        null,
        inferredElements,
      );
      const inferredChildElement = inferredChild.getElement();
      const representation = inferredChild.getRepresentation();
      if (!resource) {
        throw new Error(
          "Cannot use <ListGuesser> outside of a ResourceContext",
        );
      }
      if (!inferredChildElement || !representation) {
        return;
      }

      setChild(inferredChildElement);

      const components = ["List"]
        .concat(
          Array.from(
            new Set(
              Array.from(representation.matchAll(/<([^/\s\\.>]+)/g))
                .map((match) => match[1])
                .filter((component) => component !== "span"),
            ),
          ),
        )
        .sort();

      if (enableLog) {
        console.log(
          `Guessed List:

${components
  .map(
    (component) =>
      `import { ${component} } from "@/components/admin/${kebabCase(
        component,
      )}";`,
  )
  .join("\n")}

export const ${capitalize(singularize(resource))}List = () => (
    <List>
${inferredChild.getRepresentation()}
    </List>
);`,
        );
      }
    }
  }, [data, child, resource, enableLog]);

  return <ListView {...rest}>{child}</ListView>;
};

const getStringProp = (props: Record<string, unknown>, key: string) => {
  const value = props[key];
  return typeof value === "string" ? value : undefined;
};

const listFieldTypes = {
  table: {
    component: (props: Record<string, unknown>) => {
      const {
        children,
        source: _unusedSource,
        reference: _unusedReference,
        ...rest
      } = props as {
        children?: React.ReactNode;
        source?: unknown;
        reference?: unknown;
      };
      return (
        <DataTable {...(rest as Record<string, unknown>)}>
          {children as React.ReactNode}
        </DataTable>
      );
    },
    representation: (
      _props: Record<string, unknown>,
      children: { getRepresentation: () => string }[],
    ) =>
      `        <DataTable>
${children
  .map((child) => `            ${child.getRepresentation()}`)
  .join("\n")}
        </DataTable>`,
  },

  reference: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      const reference = getStringProp(props, "reference");
      if (!source || !reference) {
        return null;
      }
      return (
        <DataTable.Col source={source}>
          <ReferenceField source={source} reference={reference} />
        </DataTable.Col>
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      const reference = getStringProp(props, "reference") ?? "";
      return `<DataTable.Col source="${source}">
                <ReferenceField source="${source}" reference="${reference}" />
            </DataTable.Col>`;
    },
  },
  array: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      const children = props.children as React.ReactNode;
      const childrenArray = React.Children.toArray(children);
      const badgeSource =
        childrenArray.length > 0 &&
        React.isValidElement(childrenArray[0]) &&
        typeof (childrenArray[0].props as Record<string, unknown>).source ===
          "string"
          ? ((childrenArray[0].props as Record<string, unknown>)
              .source as string)
          : undefined;
      return (
        <DataTable.Col source={source}>
          <ArrayField source={source}>
            <SingleFieldList>
              {badgeSource ? <BadgeField source={badgeSource} /> : null}
            </SingleFieldList>
          </ArrayField>
        </DataTable.Col>
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
          const childProps = (
            firstChild as {
              getProps: () => Record<string, unknown>;
            }
          ).getProps();
          return getStringProp(childProps, "source") ?? "";
        }
        return "";
      })();
      return `<DataTable.Col source="${source}">
               <ArrayField source="${source}">
                    <SingleFieldList>
                        <BadgeField source="${badgeSource}" />
                   </SingleFieldList>
                </ArrayField>
            </DataTable.Col>`;
    },
  },
  referenceArray: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      const reference = getStringProp(props, "reference");
      if (!source || !reference) {
        return null;
      }
      const { children, ...rest } = props as { children?: React.ReactNode };
      return (
        <DataTable.Col {...(rest as Record<string, unknown>)} source={source}>
          <ReferenceArrayField
            {...(rest as Record<string, unknown>)}
            source={source}
            reference={reference}
          >
            {children as React.ReactNode}
          </ReferenceArrayField>
        </DataTable.Col>
      );
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      const reference = getStringProp(props, "reference") ?? "";
      return `<DataTable.Col source="${source}">
                <ReferenceArrayField source="${source}" reference="${reference}" />
            </DataTable.Col>`;
    },
  },
  string: {
    component: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source");
      if (!source) {
        return null;
      }
      return <DataTable.Col source={source} />;
    },
    representation: (props: Record<string, unknown>) => {
      const source = getStringProp(props, "source") ?? "";
      return `<DataTable.Col source="${source}" />`;
    },
  },
};

const kebabCase = (name: string) => {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
};
