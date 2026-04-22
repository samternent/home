import { t as useAppApi } from "./api-Er-7VpRh.js";
import "./src-De70Jo1T.js";
import { defineComponent, mergeProps, useSSRContext } from "vue";
import { useRouter } from "vue-router";
import { ssrRenderAttrs } from "vue/server-renderer";
var RouteLaunch_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
	__name: "RouteLaunch",
	__ssrInlineRender: true,
	setup(__props) {
		useAppApi();
		useRouter();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<section${ssrRenderAttrs(mergeProps({
				class: "mx-auto w-full max-w-3xl p-6",
				"data-test": "launch-v2"
			}, _attrs))}><h1>ConcordOS Launch Page</h1></section>`);
		};
	}
});
var _sfc_setup = RouteLaunch_vue_vue_type_script_setup_true_lang_default.setup;
RouteLaunch_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("src/routes/app/RouteLaunch.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var RouteLaunch_default = RouteLaunch_vue_vue_type_script_setup_true_lang_default;
export { RouteLaunch_default as default };
