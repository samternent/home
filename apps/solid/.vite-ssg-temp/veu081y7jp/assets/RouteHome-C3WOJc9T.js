import { t as useAppApi } from "./api-Er-7VpRh.js";
import "./src-De70Jo1T.js";
import { computed, createTextVNode, defineComponent, mergeProps, onMounted, ref, resolveComponent, unref, useSSRContext, withCtx } from "vue";
import { ssrInterpolate, ssrRenderAttrs, ssrRenderComponent } from "vue/server-renderer";
var RouteHome_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "RouteHome",
	__ssrInlineRender: true,
	setup(__props) {
		const appApi = useAppApi();
		const loadError = ref(null);
		const activeIdentityLabel = computed(() => appApi.identity.activeIdentity.value?.label ?? "none");
		const userCount = computed(() => appApi.users.all().length);
		const permissionCount = computed(() => appApi.permissions.all().length);
		onMounted(async () => {
			try {
				await appApi.load();
				await appApi.identity.ensureActiveIdentity();
			} catch (error) {
				loadError.value = error instanceof Error ? error.message : String(error);
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			const _component_RouterLink = resolveComponent("RouterLink");
			_push(`<section${ssrRenderAttrs(mergeProps({
				class: "space-y-4",
				"data-test": "home-v2"
			}, _attrs))}><p class="m-0 text-xs uppercase tracking-[0.18em] text-[var(--ui-fg-muted)]"> Home </p><h2 class="m-0 text-2xl font-semibold text-[var(--ui-fg)]"> Concord host is active </h2><p class="m-0 max-w-2xl text-sm leading-6 text-[var(--ui-fg-muted)]"> This app runs as a thin host over Concord. Replay of committed plus staged entries is the only state source. </p><dl class="m-0 grid gap-2 rounded-lg border border-[var(--ui-border)] p-3 text-sm"><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Status </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-status">${ssrInterpolate(unref(appApi).status.value)}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Integrity valid </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-integrity">${ssrInterpolate(unref(appApi).getState().integrityValid ? "yes" : "no")}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Staged entries </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-staged-count">${ssrInterpolate(unref(appApi).getState().stagedCount)}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Active identity </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-active-identity">${ssrInterpolate(activeIdentityLabel.value)}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Users </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-user-count">${ssrInterpolate(userCount.value)}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Permissions </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="home-v2-permission-count">${ssrInterpolate(permissionCount.value)}</dd></div></dl>`);
			if (loadError.value || unref(appApi).lastError.value) _push(`<p class="m-0 text-sm text-[var(--ui-critical)]" data-test="home-v2-error">${ssrInterpolate(loadError.value ?? unref(appApi).lastError.value)}</p>`);
			else _push(`<!---->`);
			_push(ssrRenderComponent(_component_RouterLink, {
				to: "/permissions",
				class: "inline-flex rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] no-underline transition hover:bg-[var(--ui-tonal-secondary)]",
				"data-test": "home-v2-permissions-link"
			}, {
				default: withCtx((_, _push$1, _parent$1, _scopeId) => {
					if (_push$1) _push$1(` Open permissions `);
					else return [createTextVNode(" Open permissions ")];
				}),
				_: 1
			}, _parent));
			_push(`</section>`);
		};
	}
});
var _sfc_setup = RouteHome_vue_vue_type_script_setup_true_lang_default.setup;
RouteHome_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/routes/app/RouteHome.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RouteHome_default = RouteHome_vue_vue_type_script_setup_true_lang_default;
export { RouteHome_default as default };
