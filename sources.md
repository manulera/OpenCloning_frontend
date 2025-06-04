# How to add a new source

* Create a new file `Sources/SourceName.jsx`
* Include it in `Sources/Source.jsx` in the `if (source.type` part. Add the necessary components before or after it (`MultipleOutputsSelector` or `MultipleInputsSelector`).
* In `Sources/Source.jsx`, add it to the `<select` element.
