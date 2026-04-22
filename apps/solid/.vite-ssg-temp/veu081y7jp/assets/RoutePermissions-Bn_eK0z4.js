import { t as useAppApi } from "./api-Er-7VpRh.js";
import "./src-De70Jo1T.js";
import { computed, defineComponent, mergeProps, onMounted, ref, unref, useSSRContext } from "vue";
import { ssrInterpolate, ssrRenderAttr, ssrRenderAttrs, ssrRenderList } from "vue/server-renderer";
var RoutePermissions_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "RoutePermissions",
	__ssrInlineRender: true,
	setup(__props) {
		const appApi = useAppApi();
		const createTitle = ref("");
		const createScope = ref("");
		const createError = ref(null);
		const pageError = ref(null);
		const grantErrorByPermission = ref({});
		const grantMemberIdByPermission = ref({});
		const grantMemberLabelByPermission = ref({});
		const permissions = computed(() => appApi.permissions.all());
		const activeIdentityLabel = computed(() => appApi.identity.activeIdentity.value?.label ?? "none");
		const stagedCount = computed(() => appApi.getState().stagedCount);
		onMounted(async () => {
			pageError.value = null;
			try {
				await appApi.load();
				await appApi.identity.ensureActiveIdentity();
			} catch (error) {
				pageError.value = error instanceof Error ? error.message : String(error);
			}
		});
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({
				class: "space-y-6",
				"data-test": "permissions-v2"
			}, _attrs))}><dl class="m-0 grid gap-2 rounded-lg border border-[var(--ui-border)] p-3 text-sm"><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Status </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="permissions-v2-status">${ssrInterpolate(unref(appApi).status.value)}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Active identity </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="permissions-v2-active-identity">${ssrInterpolate(activeIdentityLabel.value)}</dd></div><div class="flex items-center justify-between gap-4"><dt class="text-[var(--ui-fg-muted)]"> Staged entries </dt><dd class="m-0 text-[var(--ui-fg)]" data-test="permissions-v2-staged-count">${ssrInterpolate(stagedCount.value)}</dd></div></dl><div class="mt-3 flex gap-2"><button type="button" class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]" data-test="permissions-v2-commit"> Commit </button><button type="button" class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]" data-test="permissions-v2-discard"> Discard </button></div>`);
			if (pageError.value || unref(appApi).lastError.value) _push(`<p class="m-0 mt-2 text-sm text-[var(--ui-critical)]" data-test="permissions-v2-page-error">${ssrInterpolate(pageError.value ?? unref(appApi).lastError.value)}</p>`);
			else _push(`<!---->`);
			_push(`<form class="rounded-xl border border-[var(--ui-border)] p-4" data-test="permission-create-form"><p class="m-0 text-sm font-medium text-[var(--ui-fg)]"> Create permission </p><div class="mt-3 grid gap-3 md:grid-cols-2"><label class="text-sm text-[var(--ui-fg-muted)]"> Title <input${ssrRenderAttr("value", createTitle.value)} data-test="permission-create-title" type="text" class="mt-1 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[var(--ui-fg)]" placeholder="Document editors"></label><label class="text-sm text-[var(--ui-fg-muted)]"> Scope (optional) <input${ssrRenderAttr("value", createScope.value)} data-test="permission-create-scope" type="text" class="mt-1 w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[var(--ui-fg)]" placeholder="workspace"></label></div>`);
			if (createError.value) _push(`<p class="m-0 mt-2 text-sm text-[var(--ui-critical)]" data-test="permission-create-error">${ssrInterpolate(createError.value)}</p>`);
			else _push(`<!---->`);
			_push(`<button type="submit" data-test="permission-create-submit" class="mt-3 rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"> Stage create </button></form>`);
			if (permissions.value.length === 0) _push(`<div class="rounded-xl border border-dashed border-[var(--ui-border)] p-6 text-sm text-[var(--ui-fg-muted)]" data-test="permissions-empty"> No permissions yet. </div>`);
			else {
				_push(`<div class="space-y-4" data-test="permissions-list"><!--[-->`);
				ssrRenderList(permissions.value, (permission) => {
					_push(`<article class="rounded-xl border border-[var(--ui-border)] p-4"${ssrRenderAttr("data-test", `permission-card-${permission.id}`)}><div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><h3 class="m-0 text-base font-medium text-[var(--ui-fg)]"${ssrRenderAttr("data-test", `permission-title-${permission.id}`)}>${ssrInterpolate(permission.title)}</h3><p class="m-0 text-sm text-[var(--ui-fg-muted)]"> Scope: ${ssrInterpolate(permission.scope ?? "document")}</p></div><p class="m-0 text-xs text-[var(--ui-fg-muted)]"> Members: ${ssrInterpolate(permission.members.length)}</p></div>`);
					if (permission.members.length) {
						_push(`<ul class="m-0 mt-3 list-none space-y-2 p-0"${ssrRenderAttr("data-test", `permission-members-${permission.id}`)}><!--[-->`);
						ssrRenderList(permission.members, (member) => {
							_push(`<li class="flex items-center justify-between gap-2 rounded-lg border border-[var(--ui-border)] px-3 py-2"${ssrRenderAttr("data-test", `permission-member-${permission.id}-${member.memberId}`)}><span class="text-sm text-[var(--ui-fg)]">${ssrInterpolate(member.memberLabel ?? member.memberId)} <span class="text-[var(--ui-fg-muted)]">(${ssrInterpolate(member.memberId)})</span></span>`);
							if (member.memberId !== unref(appApi).identity.activeIdentity.value?.identityId) _push(`<button type="button" class="rounded-lg border border-[var(--ui-border)] px-2 py-1 text-xs text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"${ssrRenderAttr("data-test", `permission-revoke-${permission.id}-${member.memberId}`)}> Stage revoke </button>`);
							else _push(`<!---->`);
							_push(`</li>`);
						});
						_push(`<!--]--></ul>`);
					} else _push(`<!---->`);
					_push(`<form class="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"${ssrRenderAttr("data-test", `permission-grant-form-${permission.id}`)}><input${ssrRenderAttr("value", grantMemberIdByPermission.value[permission.id])}${ssrRenderAttr("data-test", `permission-grant-member-id-${permission.id}`)} type="text" class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-fg)]" placeholder="member id"><input${ssrRenderAttr("value", grantMemberLabelByPermission.value[permission.id])}${ssrRenderAttr("data-test", `permission-grant-member-label-${permission.id}`)} type="text" class="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-sm text-[var(--ui-fg)]" placeholder="member label (optional)"><button type="submit" class="rounded-lg border border-[var(--ui-border)] px-3 py-2 text-sm text-[var(--ui-fg)] transition hover:bg-[var(--ui-tonal-secondary)]"${ssrRenderAttr("data-test", `permission-grant-submit-${permission.id}`)}> Stage grant </button></form>`);
					if (grantErrorByPermission.value[permission.id]) _push(`<p class="m-0 mt-2 text-sm text-[var(--ui-critical)]"${ssrRenderAttr("data-test", `permission-grant-error-${permission.id}`)}>${ssrInterpolate(grantErrorByPermission.value[permission.id])}</p>`);
					else _push(`<!---->`);
					_push(`</article>`);
				});
				_push(`<!--]--></div>`);
			}
			_push(`</section>`);
		};
	}
});
var _sfc_setup = RoutePermissions_vue_vue_type_script_setup_true_lang_default.setup;
RoutePermissions_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/routes/app/RoutePermissions.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RoutePermissions_default = RoutePermissions_vue_vue_type_script_setup_true_lang_default;
export { RoutePermissions_default as default };
