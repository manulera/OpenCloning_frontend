---
"@opencloning/ui": patch
---

Fix MultipleOutputsSelector to reset to position 0 when sources change. This was giving an error before when number of sources chaged if the position was higher than the length of the new source array, as it was trying to index the array beyond its length.
