function n(t,e="Something went wrong. Please try again."){return t?typeof t=="string"?t:t instanceof Error?t.message||e:typeof t=="object"&&(t.error||t.message)||e:e}export{n as g};
