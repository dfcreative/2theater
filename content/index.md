{% for item in performances %}
<article class="item">
	<a href="{{ getItemUrl(item) }}" class="item-link">
		{% include "preview.html" %}
	</a>
</article>
{% endfor %}