<div class="feed">
{% for item in items %}
	{# Markdown tabs are dangerous #}
	<article class="feed-item" {% if item.config.color %}style="color: {{ item.config.color.darken(0.5).desaturate(0.2) }}"{% endif %}>
		<a href="{{ getItemUrl(item) }}" class="feed-item-link">
			{% set previewClass = "feed-item" %}
			{% include "preview.html" %}

			{# Calc per-item colors #}
			{% if item.config.colors[0] %}
				{% set highlightColor = item.config.colors[0].saturate(0.3).darken(0.05).blacken(0.05) %}
			{% endif %}

			<header	class="feed-item-header" {% if highlightColor %}style="background-image: radial-gradient(ellipse farthest-side at center 80%, {{ highlightColor.alpha(0.6) }} 5%, {{ highlightColor.alpha(0.3) }} 40%, {{ highlightColor.alpha(0.09) }} 72%, {{ highlightColor.alpha(0) }} 95%);"{% endif %}>
				<h2 class="feed-item-header-title" >{{ item.title }}</h2>
			</header>
		</a>
	</article>
{% endfor %}
	{# a couple of stubs for flex grid #}
	<div class="feed-item feed-item-stub"></div>
	<div class="feed-item feed-item-stub"></div>
</div>