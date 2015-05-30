{% for play in plays %}
<article class="play">
	<a href="{{ getUrl(play) }}" class="play-link">
		<img class="play-preview" src="{{ getThumbnailUrl(play) }}"/>
	</a>
</article>
{% endfor %}