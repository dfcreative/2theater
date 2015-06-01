<div class="feed">
{% for item in items %}
	{# Markdown tabs are dangerous #}
	<article class="feed-item">
		<a href="{{ getItemUrl(item) }}" class="feed-item-link">
			{% set previewClass = "feed-item" %}
			{% include "preview.html" %}
<header class="feed-item-header">
	<h2 class="feed-item-header-title">{{ item.title }}</h2>
</header>
		</a>
	</article>
{% endfor %}
	{# a couple of stubs for flex grid #}
	<div class="feed-item feed-item-stub"></div>
	<div class="feed-item feed-item-stub"></div>
</div>