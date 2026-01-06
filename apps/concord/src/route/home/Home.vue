<template>
  <section style="text-align: center">
    <h1 style="">Concord.</h1>
    <p>Client-side verifiable ledger system.</p>

    <ul
      style="
        display: flex;
        justify-content: center;
        gap: 2em;
        padding: 0;
        list-style: none;
      "
    >
      <li>
        <RouterLink to="/overview/what-is-concord">What is Concord?</RouterLink>
      </li>
      <li>
        <RouterLink to="/overview/core-primitives">Core primitives</RouterLink>
      </li>
      <li>
        <RouterLink to="/overview/scope-and-non-goals"
          >Scope and non-goals</RouterLink
        >
      </li>
      <li><RouterLink to="/playground">Playground</RouterLink></li>
    </ul>
  </section>
</template>
