{% for play in plays %}
<article class="play">
	<img class="play-preview" src="{{ getThumbnail(play) }}"/>
</article>
{% endfor %}