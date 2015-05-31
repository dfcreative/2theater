{% for play in plays %}
<article class="play">
	<a href="{{ getItemUrl(play) }}" class="play-link">
		{% if play.config.images %}
			<div class="play-preview swiper-container">
				<div class="swiper-wrapper">
					{% for image in play.config.images %}
						<div class="swiper-slide">
							<img class="play-preview-image" src="{{ getThumbnailUrl(play, image) }}">
						</div>
					{% endfor %}
				</div>
			</div>
		{% else %}
			<img class="play-preview" src="{{ getThumbnailUrl(play) }}"/>
		{% endif %}
	</a>
</article>
{% endfor %}