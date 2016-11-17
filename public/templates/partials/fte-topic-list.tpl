<!-- BEGIN topics -->
<tr>
  <td>
    <a href="{config.relative_path}/topic/{topics.slug}<!-- IF topics.bookmark -->/{topics.bookmark}<!-- ENDIF topics.bookmark -->" itemprop="url">{topics.title}</a>
  </td>
  <td class="fte-m16">{topics.category.name}</td>
  <td class="fte-m16">{topics.humanDate.full}</td>
  <td class="fte-w1" <!-- IF !isSelf -->style="display:none;"<!-- ENDIF !isSelf -->><i class="fa fa-fw fa-close" style="color:red;"></i></td>
</tr>
<!-- END topics -->
