<div class="feed">
{% for item in performances %}
	{# Markdown tabs are dangerous #}
	<article class="feed-item">
		<a href="{{ getItemUrl(item) }}" class="feed-item-link">
			{% set previewClass = "feed-item" %}
			{% include "preview.html" %}
		</a>
	</article>
{% endfor %}
	{# a couple of stubs for flex grid #}
	<div class="feed-item feed-item-stub"></div>
	<div class="feed-item feed-item-stub"></div>
</div>