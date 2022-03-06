<div class="row fte-theme-scout">

  <!-- IF carousel -->
  <div class="glide">
    <div class="glide__track" data-glide-el="track">
      <ul class="glide__slides">
  <!-- END carousel -->

        <!-- BEGIN topics -->
        <!-- IF carousel -->
        <li class="glide__slide" tid="{topics.tid}">
        <!-- ELSE -->
        <div class="col-xs-6 col-sm-4 tid="{topics.tid}">
        <!-- END carousel -->

          <a href="{config.relative_path}/topic/{topics.slug}" class="scout-container">
            <figure class="scout-figure" style="background-color: {topics.user.icon:bgColor};
            <!-- IF topics.imageurl -->
            background-image: url({topics.imageurl});
            <!-- END topics.imageurl -->
            "></figure>
            <div class="scout-text">
              <span class="scout-category"><em>{topics.category.name}</em></span>
              <span class="scout-title">{topics.title}</span>
            </div>
          </a>

        <!-- IF carousel -->
        </li>
        <!-- ELSE -->
        </div>
        <!-- END carousel -->
        <!-- END topics -->

  <!-- IF carousel -->
      </ul>
    </div>
    <div class="glide__arrows" data-glide-el="controls">
      <button class="glide__arrow glide__arrow--prev" data-glide-dir="<">
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
          <path d="m0,12l10.975,11l2.848,-2.828l-6.176,-6.176l16.353,0l0,-3.992l-16.354,0l6.176,-6.176l-2.847,-2.828l-10.975,11z" fill="#e0e0e0" id="svg_1"/>
        </svg>
      </button>
      <button class="glide__arrow glide__arrow--next" data-glide-dir=">">
        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
          <path d="m13.025,1l-2.847,2.828l6.176,6.176l-16.354,0l0,3.992l16.354,0l-6.176,6.176l2.847,2.828l10.975,-11l-10.975,-11z" fill="#e0e0e0" id="svg_1"/>
        </svg>
      </button>
    </div>
  </div>
  <!-- END carousel -->

</div>
