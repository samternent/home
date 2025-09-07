// No-code app builder composable - Multiple Apps Per Ledger
import { computed, provide, inject, shallowRef, watch } from "vue";
import { useLedger } from "@/module/ledger/useLedger";
import { generateId } from "ternent-utils";

const useAppBuilderSymbol = Symbol("useAppBuilder");

export function provideAppBuilder() {
  const { addItem, getCollection, removeItem, ledger } = useLedger();

  // Reactive refs for app data
  const appsData = shallowRef([]);
  const schemasData = shallowRef([]);
  const viewsData = shallowRef([]);

  // Map to store reactive schema data refs
  const schemaDataRefs = new Map();

  // Update all data from ledger (called by watcher)
  function updateFromLedger() {
    // Get all ledger apps
    const appsCollection = getCollection("ledger_apps");
    appsData.value = [
      ...(appsCollection?.data?.map((item) => item.data) || []),
    ];

    // Get app schemas - use spread to create new array reference
    const schemaCollection = getCollection("app_schemas");
    schemasData.value = [
      ...(schemaCollection?.data?.map((item) => item.data) || []),
    ];

    // Get app views - use spread to create new array reference
    const viewCollection = getCollection("app_views");
    viewsData.value = [
      ...(viewCollection?.data?.map((item) => item.data) || []),
    ];

    // Update schema data for all registered schemas
    for (const [schemaId, dataRef] of schemaDataRefs) {
      const dataCollection = getCollection(`schema_${schemaId}`);
      dataRef.value = [
        ...(dataCollection?.data?.map((item) => item.data) || []),
      ];
    }
  }

  // Watch ledger changes and update all data
  watch(ledger, updateFromLedger, { immediate: true });

  // Computed properties using reactive refs
  const apps = computed(() => appsData.value);
  const schemas = computed(() => schemasData.value);
  const views = computed(() => viewsData.value);

  // Helper functions for getting app-specific data
  function getApp(appId) {
    return apps.value.find((app) => app.id === appId) || null;
  }

  function getAppSchemas(appId) {
    return schemas.value.filter((schema) => schema.appId === appId);
  }

  function getAppViews(appId) {
    return views.value.filter((view) => view.appId === appId);
  }

  // Get reactive schema data for a specific app and schema
  function getSchemaData(appId, schemaId) {
    const dataCollection = getCollection(`schema_${schemaId}`);
    return dataCollection?.data?.map((item) => item.data) || [];
  }

  // Create app configuration for current ledger
  async function createApp(appData) {
    const app = {
      id: generateId(),
      name: appData.name || "My App",
      description: appData.description || "",
      icon: appData.icon || "📱",
      category: appData.category || "custom",
      color: appData.color || "primary",
      type: appData.type || "custom", // list, kanban, form, dashboard
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...appData,
    };

    await addItem(app, "ledger_apps");
    return app.id;
  }

  // Update app configuration
  async function updateApp(appId, updates) {
    const app = apps.value.find((a) => a.id === appId);
    if (!app) return null;

    const updatedApp = {
      ...app,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await addItem(updatedApp, "ledger_apps");
    return updatedApp;
  }

  // Remove an app and its associated data
  async function removeApp(appId) {
    const appsCollection = getCollection("ledger_apps");
    const appItem = appsCollection?.data?.find(
      (item) => item.data.id === appId
    );

    if (appItem) {
      // Remove app
      await removeItem(appItem.id, "ledger_apps");

      // Remove associated schemas
      const appSchemas = schemas.value.filter(
        (schema) => schema.appId === appId
      );
      for (const schema of appSchemas) {
        await removeSchema(schema.id);
      }

      // Remove associated views
      const appViews = views.value.filter((view) => view.appId === appId);
      for (const view of appViews) {
        await removeView(view.id);
      }
    }
  }

  // Create a new schema for a specific app
  async function createSchema(appId, schemaData) {
    const schema = {
      id: schemaData.id || generateId(), // Use provided ID or generate new one
      appId: appId,
      name: schemaData.name,
      fields: schemaData.fields || [],
      createdAt: new Date().toISOString(),
      ...schemaData,
    };

    await addItem(schema, "app_schemas");
    return schema;
  }

  // Update an existing schema
  async function updateSchema(appId, schemaId, updates) {
    const schema = schemas.value.find(
      (s) => s.id === schemaId && s.appId === appId
    );
    if (!schema) return null;

    const updatedSchema = {
      ...schema,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await addItem(updatedSchema, "app_schemas");
    return updatedSchema;
  }

  // Remove a schema
  async function removeSchema(appId, schemaId) {
    const schemaCollection = getCollection("app_schemas");
    const schemaItem = schemaCollection?.data?.find(
      (item) => item.data.id === schemaId && item.data.appId === appId
    );

    if (schemaItem) {
      await removeItem(schemaItem.id, "app_schemas");

      // Remove schema data collection
      const dataCollection = getCollection(`schema_${schemaId}`);
      if (dataCollection?.data) {
        for (const item of dataCollection.data) {
          await removeItem(item.id, `schema_${schemaId}`);
        }
      }
    }
  }

  // Create a new view for a specific app
  async function createView(appId, viewData) {
    const view = {
      id: viewData.id || generateId(), // Use provided ID or generate new one
      appId: appId,
      name: viewData.name,
      type: viewData.type || "list",
      schemaId: viewData.schemaId,
      config: viewData.config || {},
      createdAt: new Date().toISOString(),
      ...viewData,
    };

    await addItem(view, "app_views");
    return view;
  }

  // Update an existing view
  async function updateView(appId, viewId, updates) {
    const view = views.value.find((v) => v.id === viewId && v.appId === appId);
    if (!view) return null;

    const updatedView = {
      ...view,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await addItem(updatedView, "app_views");
    return updatedView;
  }

  // Remove a view
  async function removeView(appId, viewId) {
    const viewCollection = getCollection("app_views");
    const viewItem = viewCollection?.data?.find(
      (item) => item.data.id === viewId && item.data.appId === appId
    );

    if (viewItem) {
      await removeItem(viewItem.id, "app_views");
    }
  }

  // Add data to a schema
  async function addSchemaData(schemaId, data) {
    const dataItem = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };

    await addItem(dataItem, `schema_${schemaId}`);
    return dataItem;
  }

  // Update schema data
  async function updateSchemaData(schemaId, itemId, updates) {
    const dataCollection = getCollection(`schema_${schemaId}`);
    const dataItem = dataCollection?.data?.find(
      (item) => item.data.id === itemId
    );

    if (dataItem) {
      const updatedData = {
        ...dataItem.data,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await addItem(updatedData, `schema_${schemaId}`);
      return updatedData;
    }
    return null;
  }

  // Remove schema data
  async function removeSchemaData(schemaId, itemId) {
    const dataCollection = getCollection(`schema_${schemaId}`);
    const dataItem = dataCollection?.data?.find(
      (item) => item.data.id === itemId
    );

    if (dataItem) {
      await removeItem(dataItem.id, `schema_${schemaId}`);
    }
  }

  // Export app as template
  function exportAppTemplate(appId) {
    const app = apps.value.find((a) => a.id === appId);
    if (!app) return null;

    const appSchemas = schemas.value.filter((s) => s.appId === appId);
    const appViews = views.value.filter((v) => v.appId === appId);

    return {
      template: {
        id: generateId(),
        name: app.name,
        description: app.description,
        icon: app.icon,
        category: app.category,
        color: app.color,
        type: app.type,
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        config: app,
        schemas: appSchemas,
        views: appViews,
      },
    };
  }

  // Import app template to current ledger
  async function importAppTemplate(template) {
    // Create app
    const newAppId = await createApp(template.config);

    // Create schemas
    const schemaIdMap = {};
    for (const schema of template.schemas) {
      const newSchemaId = generateId();
      schemaIdMap[schema.id] = newSchemaId;

      // Remove the old id and use the new one
      const { id, ...schemaWithoutId } = schema;
      await createSchema(newAppId, {
        ...schemaWithoutId,
        id: newSchemaId,
      });
    }

    // Update linked schema references in all schemas
    for (const schema of template.schemas) {
      const newSchemaId = schemaIdMap[schema.id];
      const updatedFields = schema.fields.map((field) => {
        if (
          field.type === "link" &&
          field.linkedSchema &&
          schemaIdMap[field.linkedSchema]
        ) {
          return { ...field, linkedSchema: schemaIdMap[field.linkedSchema] };
        }
        return field;
      });

      // Update the schema with corrected linked references
      await updateSchema(newAppId, newSchemaId, { fields: updatedFields });
    }

    // Create sample data if provided
    if (template.sampleData) {
      const dataIdMap = {};

      // Create all sample data items
      for (const [schemaId, items] of Object.entries(template.sampleData)) {
        const newSchemaId = schemaIdMap[schemaId];
        if (!newSchemaId) continue;

        dataIdMap[schemaId] = {};

        for (const item of items) {
          const { id, ...itemData } = item;

          // For linked fields, we'll update them in a second pass
          const cleanedData = { ...itemData };
          const schema = template.schemas.find((s) => s.id === schemaId);
          const linkFields =
            schema?.fields?.filter((f) => f.type === "link") || [];

          // Temporarily remove linked field values
          for (const linkField of linkFields) {
            delete cleanedData[linkField.name];
          }

          const newItem = await addSchemaData(newSchemaId, cleanedData);

          // Store the mapping for linked data references
          if (id && newItem) {
            dataIdMap[schemaId][id] = newItem.id || newItem;
          }
        }
      }

      // Second pass: update linked data references
      for (const [schemaId, items] of Object.entries(template.sampleData)) {
        const newSchemaId = schemaIdMap[schemaId];
        if (!newSchemaId) continue;

        const schema = template.schemas.find((s) => s.id === schemaId);
        const linkFields =
          schema?.fields?.filter((f) => f.type === "link") || [];

        if (linkFields.length > 0) {
          const existingData = getSchemaData(newAppId, newSchemaId);

          for (let i = 0; i < items.length; i++) {
            const originalItem = items[i];
            const existingItem = existingData[i];

            if (!existingItem) continue;

            const updates = {};
            let hasUpdates = false;

            for (const linkField of linkFields) {
              const originalLinkedId = originalItem[linkField.name];
              const linkedSchemaId = linkField.linkedSchema;

              if (
                originalLinkedId &&
                dataIdMap[linkedSchemaId]?.[originalLinkedId]
              ) {
                updates[linkField.name] =
                  dataIdMap[linkedSchemaId][originalLinkedId];
                hasUpdates = true;
              }
            }

            if (hasUpdates) {
              await updateSchemaData(newSchemaId, existingItem.id, updates);
            }
          }
        }
      }
    }

    // Create views (update schema references)
    for (const view of template.views) {
      // Remove the old id and use a new one
      const { id, ...viewWithoutId } = view;
      await createView(newAppId, {
        ...viewWithoutId,
        id: generateId(),
        schemaId: schemaIdMap[view.schemaId] || view.schemaId,
      });
    }

    return newAppId;
  }

  // Migration helper: Convert existing tasks to an app
  async function migrateTasks() {
    const tasksCollection = getCollection("tasks");
    const existingTasks = tasksCollection?.data || [];

    if (existingTasks.length === 0) return null;

    // Create Tasks app
    const tasksAppId = await createApp({
      name: "Tasks",
      description: "Migrated task list",
      icon: "✅",
      type: "list",
      category: "productivity",
    });

    // Create schema for tasks
    const taskSchema = await createSchema(tasksAppId, {
      name: "Task",
      fields: [
        { id: generateId(), name: "name", type: "text", required: true },
        {
          id: generateId(),
          name: "completed",
          type: "boolean",
          required: false,
        },
        {
          id: generateId(),
          name: "description",
          type: "textarea",
          required: false,
        },
      ],
    });

    // Migrate existing task data
    for (const taskItem of existingTasks) {
      await addSchemaData(taskSchema.id, {
        name: taskItem.data.name || "Untitled Task",
        completed: taskItem.data.completed === "true",
        description: taskItem.data.description || "",
      });
    }

    return getApp(tasksAppId);
  }

  const appBuilder = {
    // Data
    apps,
    schemas,
    views,

    // Helper functions
    getApp,
    getAppSchemas,
    getAppViews,
    getSchemaData,

    // App actions
    createApp,
    updateApp,
    removeApp,

    // Schema actions
    createSchema,
    updateSchema,
    removeSchema,
    addSchemaData,
    updateSchemaData,
    removeSchemaData,

    // View actions
    createView,
    updateView,
    removeView,

    // Template actions
    exportAppTemplate,
    importAppTemplate,
    migrateTasks,
  };

  provide(useAppBuilderSymbol, appBuilder);
  return appBuilder;
}

export function useAppBuilder() {
  const appBuilder = inject(useAppBuilderSymbol);
  if (!appBuilder) {
    throw new Error(
      "useAppBuilder must be used within a component that provides the app builder"
    );
  }
  return appBuilder;
}
